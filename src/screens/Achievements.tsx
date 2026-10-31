import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { loadMyAchievements } from '../lib/achievements';
import { ACH_DEFS, progressOf, type AchDef, type AchRow } from '../engine/achievements';
import { drillById } from '../lib/drills';
import { fmtDate } from '../lib/format';
import { AchIcon } from '../components/AchIcon';
import { StaleHint, Empty } from '../components/Ui';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';

export default function Achievements() {
  const { t } = useTranslation();
  const user = useUser();
  const data = useRemote<AchRow[]>(user ? 'achievements' : null, loadMyAchievements, [user?.id]);
  const [open, setOpen] = useState<AchDef | null>(null);
  const rows = new Map((data.value ?? []).map((r) => [r.key, r]));
  const sections: [string, AchDef['kind']][] = [['achv.medals', 'medal'], ['achv.achievements', 'achievement'], ['achv.titles', 'title_badge']];

  return (
    <>
      <Link to="/" className="small">← {t('nav.home')}</Link>
      <h1>{t('achv.title')}</h1>
      {!isDemo && (!supabase || user === null) ? <Empty text={t('achv.signedOut')} link={supabase ? { to: '/profile', label: t('auth.signIn') } : undefined} /> : (
        <>
          <StaleHint r={data} />
          {sections.map(([label, kind]) => (
            <section key={kind} className="stack" aria-label={t(label)}>
              <span className="label">{t(label)}</span>
              <div className="ach-grid">
                {ACH_DEFS.filter((d) => d.kind === kind).map((d) => {
                  const r = rows.get(d.key);
                  const locked = !r?.earned_at;
                  const pr = progressOf(d, r);
                  const name = t(`ach.${d.key}.name`);
                  return (
                    <button key={d.key} className="ach-cell" onClick={() => setOpen(d)} aria-label={`${name}${locked ? ` – ${t('achv.locked')}` : ''}`}>
                      <AchIcon k={d.key} tier={r?.tier} locked={locked} label={name} />
                      <span className="small" style={{ fontWeight: 600, color: locked ? 'var(--muted)' : 'var(--text)' }}>{name}</span>
                      {r?.tier && <span className="small muted">{t(`tier.${r.tier}`)}</span>}
                      {pr && (locked || kind === 'medal') && (
                        <span className="stack" style={{ gap: 3, width: '100%' }}>
                          <span className="bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (pr[0] / pr[1]) * 100)}%` }} /></span>
                          <span className="small muted num">{pr[0]} / {pr[1]}</span>
                        </span>
                      )}
                      {kind === 'title_badge' && !locked && <span className="small muted num">{t('achv.weeks', { n: Number(r?.progress?.weeks ?? 0) })}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
      {open && <Detail def={open} row={rows.get(open.key)} onClose={() => setOpen(null)} />}
    </>
  );
}

function Detail({ def, row, onClose }: { def: AchDef; row?: AchRow; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const name = t(`ach.${def.key}.name`);
  const pr = progressOf(def, row);
  const p = row?.progress ?? {};
  const first = def.kind === 'medal' && row?.tier ? (p.tier_dates as Record<string, string> | undefined)?.bronze ?? row.earned_at : row?.earned_at;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet card stack" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.stopPropagation()}>
        <div className="row"><AchIcon k={def.key} tier={row?.tier} locked={!row?.earned_at} size={64} label={name} /><h2>{name}{row?.tier ? ` · ${t(`tier.${row.tier}`)}` : ''}</h2></div>
        <p className="text-2" style={{ margin: 0 }}>{t(`ach.${def.key}.crit`)}</p>
        {row?.earned_at ? <span className="small">{t('achv.earned', { date: fmtDate(first ?? row.earned_at, i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) })}</span> : <span className="small muted">{t('achv.locked')}</span>}
        {def.key === 'flawless' && Array.isArray(p.drills) && p.drills.length > 0 && (
          <span className="small text-2">{t('achv.drillsDone', { list: (p.drills as string[]).map((id) => drillById(id)?.title ?? id).join(', ') })}</span>
        )}
        {def.kind === 'title_badge' && row?.earned_at && <span className="small text-2">{t('achv.weeks', { n: Number(p.weeks ?? 0) })}{p.holding ? ` · ${t('achv.holding')}` : ''}</span>}
        {Boolean(p.needs_hcp) && <Link to="/profile" className="small">{t('achv.needsHcp')}</Link>}
        {pr && <><span className="bar"><span style={{ width: `${Math.min(100, (pr[0] / pr[1]) * 100)}%` }} /></span><span className="small muted num">{pr[0]} / {pr[1]}</span></>}
        <button className="btn" onClick={onClose} autoFocus>{t('achv.close')}</button>
      </div>
    </div>
  );
}
