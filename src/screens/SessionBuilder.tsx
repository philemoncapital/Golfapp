import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, type LocalTemplate } from '../lib/db';
import { useLive } from '../lib/useLive';
import { DRILLS, drillById, CAT_COLOR } from '../lib/drills';
import { setPlan, lastCompletedIds, getPlan } from '../lib/plan';
import { listTemplates, savePlanAsTemplate, deleteTemplate, loadTemplate } from '../lib/templates';
import { buildSession, sessionMinutes } from '../engine/session';
import { unlockAudio } from '../lib/feedback';
import { CategoryStrip } from '../components/CategoryStrip';
import { SessionTile } from '../components/SessionTile';

// Placeholder split until Phase 5 (sourced recommendations) is approved.
const EQUAL_SPLIT = { tee: 0.25, approach: 0.25, short: 0.25, putting: 0.25 };

export default function SessionBuilder() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [avail, setAvail] = useState(60);
  const [name, setName] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const plan = useLive(() => db.sessions.where('status').equals('planned').first(), [], undefined);
  const saved = useLive(listTemplates, [], [] as LocalTemplate[]);
  const ids = plan?.drill_ids ?? [];
  const drills = ids.map((id) => drillById(id)!).filter(Boolean);
  const total = sessionMinutes(drills);
  useEffect(() => { setName(plan?.name ?? ''); }, [plan?.id, plan?.name]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...ids]; const j = i + dir; if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; void setPlan(next);
  };
  const auto = async () => {
    const results = await db.results.toArray();
    const s = buildSession({ available_min: avail, split: EQUAL_SPLIT, drills: DRILLS, results, last_session_ids: await lastCompletedIds() });
    await setPlan(s.map((d) => d.id));
  };
  const save = async (asNew = false) => {
    if (!drills.length) return;
    const n = name.trim() || t('session.defaultName', { min: total });
    await savePlanAsTemplate(n, asNew);
    setName(n); setFlash(t('session.savedOk')); setTimeout(() => setFlash(null), 1600);
  };
  const clear = async () => { const p = await getPlan(); await db.sessions.update(p.id, { drill_ids: [], total_min: 0, name: undefined, template_id: undefined }); };
  const start = async () => {
    unlockAudio(); // must run inside the tap for iOS
    if (!plan) return;
    await db.sessions.update(plan.id, { status: 'started', started_at: new Date().toISOString(), synced: 0, name: name.trim() || plan.name });
    nav('/live');
  };

  return (
    <>
      <div className="row between">
        <h1>{t('session.title')}</h1>
        <span className="pill num">{total} {t('drills.min')}</span>
      </div>

      <section className="card stack">
        <input className="field title-field" placeholder={t('session.namePh')} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-label={t('session.name')} />
        {drills.length > 0 && <CategoryStrip drills={drills} />}
        {drills.length === 0 ? <p className="text-2 small" style={{ margin: 0 }}>{t('session.emptyShort')}</p> : (
          <ol className="list">
            {drills.map((d, i) => (
              <li key={d.id} className="row between">
                <span className="row" style={{ minWidth: 0 }}><span className="dot" style={{ background: CAT_COLOR[d.category] }} />
                  <span className="stack" style={{ gap: 0, minWidth: 0 }}><b className="ellipsis">{d.title}</b><span className="small muted num">{d.duration_min} {t('drills.min')}</span></span></span>
                <span className="row" style={{ gap: 4, flexShrink: 0 }}>
                  <button className="btn icon" aria-label={t('session.up')} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button className="btn icon" aria-label={t('session.down')} onClick={() => move(i, 1)} disabled={i === drills.length - 1}>↓</button>
                  <button className="btn icon" aria-label={t('session.remove')} onClick={() => setPlan(ids.filter((x) => x !== d.id))}>✕</button>
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="row wrap" style={{ gap: 8 }}>
          <Link to="/drills" className="btn" style={{ flex: 1 }}>＋ {t('session.addDrills')}</Link>
          <span className="row" style={{ gap: 6, flex: 1 }}>
            <input className="field num" type="number" inputMode="numeric" min={10} max={300} step={5} value={avail} onChange={(e) => setAvail(Number(e.target.value))} style={{ width: 72 }} aria-label={t('session.haveMinutes')} />
            <button className="btn" onClick={auto} style={{ flex: 1 }} title={t('session.splitNote')}>⚡ {t('session.autoShort')}</button>
          </span>
        </div>
        <div className="grid2">
          <button className="btn" disabled={!drills.length} onClick={() => save()}>{flash ?? (plan?.template_id ? t('session.update') : t('session.save'))}</button>
          <button className="btn primary" disabled={!drills.length} onClick={start}>{t('session.start')}</button>
        </div>
        {plan?.template_id && drills.length > 0 && (
          <div className="row between small">
            <button className="linkbtn" onClick={() => save(true)}>{t('session.saveAsNew')}</button>
            <button className="linkbtn" onClick={clear}>{t('session.clear')}</button>
          </div>
        )}
      </section>

      <section className="stack" aria-label={t('session.savedList')}>
        <span className="label">{t('session.savedList')}</span>
        {saved.length === 0 ? <p className="small muted" style={{ margin: 0 }}>{t('session.noSaved')}</p> : (
          <div className="tile-row" key={saved.length}>
            {saved.map((s) => (
              <SessionTile key={s.id} tpl={s} active={plan?.template_id === s.id} onOpen={() => loadTemplate(s.id)}
                onDelete={() => { if (confirm(t('session.confirmDelete', { name: s.name }))) void deleteTemplate(s.id); }} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
