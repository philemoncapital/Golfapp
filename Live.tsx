import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, getSettings, saveResult } from '../lib/db';
import { useLive } from '../lib/useLive';
import { drillById } from '../lib/drills';
import { Pictogram } from '../components/Pictogram';
import { ResultInput } from './ResultInput';
import { resultHcp, targetForHcp } from '../engine/handicap';
import type { ResultInput as RI } from '../engine/types';
import { signal, keepAwake, canVibrate } from '../lib/feedback';
import { syncNow } from '../lib/sync';
import { fmtTarget } from './DrillDetail';

const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

export default function Live() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const session = useLive(() => db.sessions.where('status').equals('started').first(), [], undefined);
  const settings = useLive(getSettings, [], null);
  const [idx, setIdx] = useState(0);
  // Timer based on timestamps, so it stays correct when the phone throttles background tabs.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [input, setInput] = useState<RI | null>(null);
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState<{ hcp: number } | null>(null);
  const signalled = useRef(false);

  useEffect(() => { void keepAwake(true); return () => void keepAwake(false); }, []);
  useEffect(() => { const h = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(h); }, []);

  const drill = session ? drillById(session.drill_ids[idx]) : undefined;
  const elapsed = ((pausedAt ?? now) - startedAt) / 1000;
  const remaining = (drill?.duration_min ?? 0) * 60 - elapsed;
  useEffect(() => {
    if (drill && remaining <= 0 && !signalled.current) { signalled.current = true; signal('limit'); }
  }, [remaining, drill]);

  if (session === undefined) return <p className="text-2">{t('session.empty')} <Link to="/session">{t('session.title')}</Link></p>;
  if (!drill) return null;
  const n = session.drill_ids.length;

  const save = async () => {
    if (!input) return;
    await saveResult(drill.id, input, session.id, notes || undefined);
    setSummary({ hcp: resultHcp(drill, input) });
  };
  const next = async () => {
    setSummary(null); setInput(null); setNotes(''); signalled.current = false;
    if (idx + 1 < n) { setIdx(idx + 1); setStartedAt(Date.now()); setPausedAt(null); return; }
    await db.sessions.update(session.id, { status: 'completed', completed_at: new Date().toISOString(), synced: 0 });
    void syncNow();
    nav('/');
  };
  const togglePause = () => {
    if (pausedAt) { setStartedAt(startedAt + (Date.now() - pausedAt)); setPausedAt(null); } else setPausedAt(Date.now());
  };
  const band = settings?.real_hcp != null ? targetForHcp(drill.scoring.bands, settings.real_hcp) : null;

  return (
    <>
      <div className="row between">
        <span className="label">{t('live.drill', { i: idx + 1, n })}</span>
        <button className="btn" onClick={togglePause}>{pausedAt ? t('live.resume') : t('live.pause')}</button>
      </div>
      <h1>{drill.title}</h1>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <span className="big" style={{ fontSize: 72, color: remaining <= 0 ? 'var(--weak)' : undefined }} aria-live="off">{mmss(remaining)}</span>
        <span className="small muted" style={{ paddingBottom: 8 }}>{remaining <= 0 ? t('live.timeUp') : t('live.remaining')}</span>
      </div>
      <div className="bar"><span style={{ width: `${Math.min(100, (elapsed / (drill.duration_min * 60)) * 100)}%` }} /></div>
      {!canVibrate() && idx === 0 && elapsed < 15 && <span className="small muted">{t('live.soundHint')}</span>}

      {!summary ? (
        <>
          <div className="card" style={{ padding: 8 }}><Pictogram drill={drill} size="sm" /></div>
          <ResultInput key={drill.id} drill={drill} onChange={setInput} elapsedMin={elapsed / 60} />
          <label className="stack small"><span className="label">{t('live.notes')}</span>
            <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} /></label>
          <div className="grid2">
            <button className="btn" onClick={next}>{t('live.skip')}</button>
            <button className="btn primary" disabled={!input} onClick={save}>{t('live.save')}</button>
          </div>
        </>
      ) : (
        <section className="card stack">
          <span className="label">{t('live.yourHcp')}</span>
          <span className="big">{summary.hcp < 0 ? `+${Math.abs(summary.hcp)}` : summary.hcp}</span>
          {band && <span className="text-2">{t('live.target')} (HCP {band.hcp_hi}–{band.hcp_lo}): <b className="num">{fmtTarget(band.target)}</b></span>}
          <button className="btn primary block" onClick={next}>{idx + 1 < n ? t('live.next') : t('live.finish')}</button>
        </section>
      )}
    </>
  );
}
