import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { loadMyAchievements } from '../lib/achievements';
import { ACH_DEFS, progressOf, type AchDef, type AchRow } from '../engine/achievements';
import { drillById } from '../lib/drills';
import { fmtDate } from '../lib/format';
import { Badge, BADGE_METAL, type Tier } from '../components/Badge';
import { StaleHint, Empty } from '../components/Ui';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';

const TIERS: Tier[] = ['bronze', 'silver', 'gold'];
const NEXT_TIER: Record<string, Tier | undefined> = { none: 'bronze', bronze: 'silver', silver: 'gold' };
const titleTypeOf = (key: string) => (key.endsWith('_last') ? 'last' : 'leader') as 'leader' | 'last';
const metalKey = (def: AchDef, r?: AchRow) => (!r?.earned_at ? 'locked' : def.kind === 'medal' ? (r.tier ?? 'locked') : def.kind === 'title_badge' ? titleTypeOf(def.key) : 'achievement');

/** Number overlapping the badge: counter for medals / Flawless / items with a target, weeks for titles. null = no number. */
export function badgeNumber(def: AchDef, r?: AchRow): string | null {
  if (!r?.earned_at) return null;
  const p = r.progress ?? {};
  if (def.kind === 'medal' || def.key === 'flawless') return String(Number(p.value ?? 0));
  if (def.kind === 'title_badge') return String(Number(p.weeks ?? 0));
  if (p.target != null) return String(Number(p.value ?? 0));
  return null;
}

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
          {sections.map(([label, kind]) => {
            const defs = ACH_DEFS.filter((d) => d.kind === kind).sort((a, b) => Number(!rows.get(a.key)?.earned_at) - Number(!rows.get(b.key)?.earned_at));
            return (
              <section key={kind} className="stack" aria-label={t(label)}>
                <span className="label">{t(label)}</span>
                <div className="ach-grid">
                  {defs.map((d) => {
                    const r = rows.get(d.key);
                    const locked = !r?.earned_at;
                    const name = t(`ach.${d.key}.name`);
                    const num = badgeNumber(d, r);
                    return (
                      <button key={d.key} className={`ach-cell ${locked ? 'locked' : ''}`} onClick={() => setOpen(d)} aria-label={`${name}${locked ? ` – ${t('achv.locked')}` : ''}`}>
                        <Badge k={d.key} kind={d.kind} tier={r?.tier} titleType={titleTypeOf(d.key)} locked={locked} size={92} label={name}
                          pill={locked ? 'lock' : num === null ? 'check' : undefined} />
                        {num !== null && <span className="ach-num num">{num}</span>}
                        <span className="ach-name" style={{ marginTop: num === null ? 6 : 0 }}>{name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}
    </>
  );
}

/** Full-screen detail: glow wash, badge + overlapping number, criterion, milestone card, tier timeline. */
function Detail({ def, row, onClose }: { def: AchDef; row?: AchRow; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const name = t(`ach.${def.key}.name`);
  const p = row?.progress ?? {};
  const locked = !row?.earned_at;
  const pr = progressOf(def, row);
  const metal = BADGE_METAL[metalKey(def, row)];
  const num = badgeNumber(def, row);
  const tierDates = (p.tier_dates as Record<string, string> | undefined) ?? {};
  const first = def.kind === 'medal' && row?.tier ? tierDates.bronze ?? row.earned_at : row?.earned_at;
  const nextTier = def.kind === 'medal' ? NEXT_TIER[row?.tier ?? 'none'] : undefined;
  const tt = titleTypeOf(def.key);
  const showMilestone = pr && (pr[0] < pr[1] || !!nextTier);
  const d = (iso: string) => fmtDate(iso, i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="ach-detail" style={{ ['--glow' as string]: metal[1] }}>
      <div className="ach-head"><button className="linkbtn" onClick={onClose} aria-label={t('achv.close')}>‹ {t('achv.title')}</button><span className="label">{t('achv.details')}</span><span /></div>
      <div className="stack" style={{ alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Badge k={def.key} kind={def.kind} tier={row?.tier} titleType={tt} locked={locked} size={220} label={name} pill={locked ? 'lock' : undefined} />
        {num !== null ? <span className="ach-big num">{num}</span> : <span style={{ height: 8 }} />}
        <h2 style={{ fontSize: 22, textAlign: 'center' }}>{name}{row?.tier ? ` · ${t(`tier.${row.tier}`)}` : ''}</h2>
        <span className="text-2 small" style={{ textAlign: 'center', maxWidth: 300 }}>{t(`ach.${def.key}.crit`)}</span>
        <span className="small muted">{row?.earned_at ? t('achv.earned', { date: d(first ?? row.earned_at) }) : t('achv.locked')}</span>
        {def.key === 'flawless' && Array.isArray(p.drills) && p.drills.length > 0 && (
          <span className="small text-2" style={{ textAlign: 'center' }}>{t('achv.drillsDone', { list: (p.drills as string[]).map((id) => drillById(id)?.title ?? id).join(', ') })}</span>
        )}
        {def.kind === 'title_badge' && row?.earned_at && p.holding ? <span className="small text-2">{t('achv.holding')}</span> : null}
        {Boolean(p.needs_hcp) && <Link to="/profile" className="small">{t('achv.needsHcp')}</Link>}
      </div>

      {showMilestone && pr && (
        <div className="card milestone">
          <div className="ms-badge">
            <Badge k={def.key} kind={def.kind} tier={row?.tier} titleType={tt} locked={locked} size={64} label={name} />
            <b className="num">{pr[0]}</b>
          </div>
          <div className="stack" style={{ flex: 1, gap: 6, alignItems: 'center', textAlign: 'center' }}>
            <span className="small" style={{ fontWeight: 700 }}>{t('achv.more', { n: Math.max(0, pr[1] - pr[0]) })}</span>
            <span className="bar" style={{ width: '100%' }}><span style={{ width: `${Math.min(100, (pr[0] / pr[1]) * 100)}%`, background: `linear-gradient(90deg, ${metal[1]}, ${metal[3]})` }} /></span>
            <span className="small muted">{t('achv.nextMilestone')}</span>
          </div>
          <div className="ms-badge" style={{ filter: 'grayscale(.7) brightness(.8)' }}>
            <Badge k={def.key} kind={def.kind} tier={nextTier ?? row?.tier} titleType={tt} size={64} label={name} pill="lock" />
            <b className="num">{pr[1]}</b>
          </div>
        </div>
      )}

      {def.kind === 'medal' && (
        <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
          {TIERS.map((tier) => (
            <div key={tier} className="stack" style={{ alignItems: 'center', gap: 2, opacity: tierDates[tier] ? 1 : 0.45 }}>
              <Badge k={def.key} kind="medal" tier={tier} locked={!tierDates[tier]} size={44} label={t(`tier.${tier}`)} />
              <span className="small" style={{ fontWeight: 600 }}>{t(`tier.${tier}`)}</span>
              <span className="small muted">{tierDates[tier] ? d(tierDates[tier]) : '–'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
