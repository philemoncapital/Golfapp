import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { loadMyAchievements } from '../lib/achievements';
import { ACH_DEFS, progressOf, type AchDef, type AchRow } from '../engine/achievements';
import { drillById } from '../lib/drills';
import { fmtDate } from '../lib/format';
import { Badge, BADGE_COLORS, type Tier } from '../components/Badge';
import { StaleHint, Empty } from '../components/Ui';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';

const NEXT_TIER: Record<string, Tier | undefined> = { none: 'bronze', bronze: 'silver', silver: 'gold' };

/** The big number under a badge: counter for medals, weeks for titles, value/target or ✓ for achievements. */
export function badgeNumber(def: AchDef, r?: AchRow): string {
  const p = r?.progress ?? {};
  if (def.kind === 'medal') return String(Number(p.value ?? 0));
  if (def.kind === 'title_badge') return r?.earned_at ? String(Number(p.weeks ?? 0)) : '–';
  if (def.key === 'flawless') return String(Number(p.value ?? 0));
  if (p.target != null) return String(Number(p.value ?? 0));
  return r?.earned_at ? '✓' : '–';
}
const colorOf = (def: AchDef, r?: AchRow) => BADGE_COLORS[!r?.earned_at ? 'locked' : def.kind === 'medal' ? (r.tier ?? 'locked') : def.kind === 'title_badge' ? (def.key.endsWith('_last') ? 'last' : 'leader') : 'achievement'][0];

export default function Achievements() {
  const { t } = useTranslation();
  const user = useUser();
  const data = useRemote<AchRow[]>(user ? 'achievements' : null, loadMyAchievements, [user?.id]);
  const [open, setOpen] = useState<AchDef | null>(null);
  const rows = new Map((data.value ?? []).map((r) => [r.key, r]));
  const sections: [string, AchDef['kind']][] = [['achv.medals', 'medal'], ['achv.achievements', 'achievement'], ['achv.titles', 'title_badge']];

  if (open) return <Detail def={open} row={rows.get(open.key)} onClose={() => setOpen(null)} />;
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
                  const name = t(`ach.${d.key}.name`);
                  return (
                    <button key={d.key} className={`ach-cell ${locked ? 'locked' : ''}`} onClick={() => setOpen(d)} aria-label={`${name}${locked ? ` – ${t('achv.locked')}` : ''}`}>
                      <Badge k={d.key} kind={d.kind} tier={r?.tier} titleType={d.key.endsWith('_last') ? 'last' : 'leader'} locked={locked} size={78} label={name} />
                      <span className="ach-num num">{badgeNumber(d, r)}</span>
                      <span className="ach-name">{name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}

/** Full-screen detail in the style of the reference: glow, big badge, big number, criterion, milestone strip. */
function Detail({ def, row, onClose }: { def: AchDef; row?: AchRow; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const name = t(`ach.${def.key}.name`);
  const p = row?.progress ?? {};
  const locked = !row?.earned_at;
  const pr = progressOf(def, row);
  const glow = colorOf(def, row);
  const first = def.kind === 'medal' && row?.tier ? (p.tier_dates as Record<string, string> | undefined)?.bronze ?? row.earned_at : row?.earned_at;
  const nextTier = def.kind === 'medal' ? NEXT_TIER[row?.tier ?? 'none'] : undefined;
  const tt = def.key.endsWith('_last') ? 'last' : 'leader';
  return (
    <div className="ach-detail" style={{ ['--glow' as string]: glow }}>
      <div className="row between"><button className="linkbtn" onClick={onClose} aria-label={t('achv.close')}>‹ {t('achv.title')}</button><span className="label">{t('achv.details')}</span><span style={{ width: 60 }} /></div>
      <div className="stack" style={{ alignItems: 'center', gap: 6, marginTop: 12 }}>
        <Badge k={def.key} kind={def.kind} tier={row?.tier} titleType={tt} locked={locked} size={210} label={name} />
        <span className="ach-big num">{badgeNumber(def, row)}</span>
        <h2 style={{ fontSize: 22 }}>{name}{row?.tier ? ` · ${t(`tier.${row.tier}`)}` : ''}</h2>
        <span className="text-2 small" style={{ textAlign: 'center', maxWidth: 300 }}>{t(`ach.${def.key}.crit`)}</span>
        <span className="small muted">{row?.earned_at ? t('achv.earned', { date: fmtDate(first ?? row.earned_at, i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) }) : t('achv.locked')}</span>
        {def.key === 'flawless' && Array.isArray(p.drills) && p.drills.length > 0 && (
          <span className="small text-2" style={{ textAlign: 'center' }}>{t('achv.drillsDone', { list: (p.drills as string[]).map((id) => drillById(id)?.title ?? id).join(', ') })}</span>
        )}
        {def.kind === 'title_badge' && row?.earned_at && <span className="small text-2">{t('achv.weeks', { n: Number(p.weeks ?? 0) })}{p.holding ? ` · ${t('achv.holding')}` : ''}</span>}
        {Boolean(p.needs_hcp) && <Link to="/profile" className="small">{t('achv.needsHcp')}</Link>}
      </div>
      {pr && (
        <div className="card milestone">
          <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
            <Badge k={def.key} kind={def.kind} tier={row?.tier} titleType={tt} locked={locked} size={58} label={name} />
            <b className="num">{pr[0]}</b>
          </div>
          <div className="stack" style={{ flex: 1, gap: 6, alignItems: 'center' }}>
            <span className="small" style={{ fontWeight: 600 }}>{t('achv.more', { n: Math.max(0, pr[1] - pr[0]) })}</span>
            <span className="bar" style={{ width: '100%' }}><span style={{ width: `${Math.min(100, (pr[0] / pr[1]) * 100)}%`, background: `linear-gradient(90deg, ${glow}, var(--accent-2))` }} /></span>
            <span className="small muted">{t('achv.nextMilestone')}</span>
          </div>
          <div className="stack" style={{ alignItems: 'center', gap: 2, opacity: 0.6 }}>
            <Badge k={def.key} kind={def.kind} tier={nextTier ?? row?.tier} titleType={tt} locked={!nextTier && def.kind === 'medal'} size={58} label={name} />
            <b className="num">{pr[1]}</b>
          </div>
        </div>
      )}
    </div>
  );
}
