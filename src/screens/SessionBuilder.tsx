import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/db';
import { useLive } from '../lib/useLive';
import { DRILLS, drillById, CAT_COLOR } from '../lib/drills';
import { setPlan, lastCompletedIds } from '../lib/plan';
import { buildSession, sessionMinutes } from '../engine/session';
import { unlockAudio } from '../lib/feedback';

// Placeholder split until Phase 5 (sourced recommendations) is approved.
const EQUAL_SPLIT = { tee: 0.25, approach: 0.25, short: 0.25, putting: 0.25 };

export default function SessionBuilder() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [avail, setAvail] = useState(60);
  const plan = useLive(() => db.sessions.where('status').equals('planned').first(), [], undefined);
  const ids = plan?.drill_ids ?? [];
  const drills = ids.map((id) => drillById(id)!).filter(Boolean);
  const total = sessionMinutes(drills);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...ids]; const j = i + dir; if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; void setPlan(next);
  };
  const auto = async () => {
    const results = await db.results.toArray();
    const s = buildSession({ available_min: avail, split: EQUAL_SPLIT, drills: DRILLS, results, last_session_ids: await lastCompletedIds() });
    await setPlan(s.map((d) => d.id));
  };
  const start = async () => {
    unlockAudio(); // must run inside the tap for iOS
    if (!plan) return;
    await db.sessions.update(plan.id, { status: 'started', started_at: new Date().toISOString(), synced: 0 });
    nav('/live');
  };

  return (
    <>
      <div className="row between"><h1>{t('session.title')}</h1><span className="num text-2">{t('session.total')} <b style={{ color: 'var(--text)' }}>{total} {t('drills.min')}</b></span></div>

      <section className="card stack">
        <label className="label" htmlFor="avail">{t('session.haveMinutes')}</label>
        <div className="row">
          <input id="avail" className="field num" type="number" inputMode="numeric" min={10} max={300} step={5} value={avail} onChange={(e) => setAvail(Number(e.target.value))} style={{ maxWidth: 110 }} />
          <button className="btn" onClick={auto} style={{ flex: 1 }}>{t('session.build')}</button>
        </div>
        <span className="small muted">{t('session.splitNote')}</span>
      </section>

      {drills.length === 0 ? <p className="text-2">{t('session.empty')} <Link to="/drills">{t('nav.drills')}</Link></p> : (
        <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {drills.map((d, i) => (
            <li key={d.id} className="card row between" style={{ padding: 12 }}>
              <span className="row"><span className="dot" style={{ background: CAT_COLOR[d.category] }} />
                <span className="stack" style={{ gap: 0 }}><b>{d.title}</b><span className="small muted num">{d.duration_min} {t('drills.min')} · {t(`cat.${d.category}`)}</span></span></span>
              <span className="row" style={{ gap: 4 }}>
                <button className="btn" aria-label={t('session.up')} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button className="btn" aria-label={t('session.down')} onClick={() => move(i, 1)} disabled={i === drills.length - 1}>↓</button>
                <button className="btn" aria-label={t('session.remove')} onClick={() => setPlan(ids.filter((x) => x !== d.id))}>✕</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <button className="btn primary block" disabled={!drills.length} onClick={start}>{t('session.start')}</button>
    </>
  );
}
