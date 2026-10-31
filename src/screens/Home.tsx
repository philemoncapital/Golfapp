import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, getSettings, type LocalResult, type LocalSession } from '../lib/db';
import { useLive } from '../lib/useLive';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { api, type FriendSession, type Standing } from '../lib/api';
import { DRILLS, CAT_COLOR, drillById } from '../lib/drills';
import { categoryHcps, overallHcp } from '../engine/handicap';
import { practiceMinutes, sessionSummaries } from '../engine/stats';
import type { AchRow } from '../engine/achievements';
import { fmtDate, fmtGap, fmtHcp, weekStart, locale } from '../lib/format';
import { AchIcon } from '../components/AchIcon';
import { TitleIcon, type TitleBoard } from '../components/TitleIcon';
import { StaleHint, Empty } from '../components/Ui';

/** Start page (PROMPT.md 9.0). Own data from the local store (works offline); friend/group blocks from the server, cached. */
export default function Home() {
  const { t, i18n } = useTranslation();
  const user = useUser();
  const settings = useLive(getSettings, [], null);
  const results = useLive(() => db.results.toArray(), [], [] as LocalResult[]);
  const sessions = useLive(() => db.sessions.toArray(), [], [] as LocalSession[]);
  const online = !!supabase && !!user;

  const cats = categoryHcps(DRILLS, results);
  const overall = overallHcp(cats);
  const real = settings?.real_hcp ?? null;
  const minutes = practiceMinutes(results, DRILLS, weekStart());
  const goal = settings?.weekly_goal_min ?? 180;
  const recent = sessionSummaries(sessions, results, DRILLS, 5);
  const titleOf = (ids: string[]) => ids.map((id) => drillById(id)?.title ?? id).join(', ');

  return (
    <>
      <div className="row between">
        <h1>{t('nav.home')}</h1>
        <span className="small muted">{new Date().toLocaleDateString(locale(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      {/* 1 + 2: handicaps */}
      <section className="card stack" aria-label={t('today.trainingHcp')}>
        <div className="grid2">
          <div className="stack" style={{ gap: 4 }}>
            <span className="label">{t('today.realHcp')}</span>
            <span className="big">{fmtHcp(real)}</span>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <span className="label">{t('today.trainingHcp')}</span>
            <span className="big" style={{ color: overall === null ? 'var(--muted)' : undefined }}>{fmtHcp(overall)}</span>
          </div>
        </div>
        {real === null && <Empty text={t('home.noHcp')} link={{ to: '/profile', label: t('today.setHcp') }} />}
        {overall === null && results.length > 0 && <span className="small muted">{t('home.overallNeeds')}</span>}
        <hr className="divider" />
        {cats.map((c) => {
          const gap = c.hcp !== null && real !== null ? c.hcp - real : null;
          return (
            <div key={c.category} className="row between">
              <span className="row"><span className="dot" style={{ background: CAT_COLOR[c.category] }} />{t(`cat.${c.category}`)}</span>
              {c.hcp === null ? <span className="small muted">{t('today.notEnough')}</span> : (
                <span className="row">
                  {gap !== null && <span className={`small num ${gap > 2 ? 'warn' : 'muted'}`} aria-label={t('home.gap')}>{fmtGap(gap)}</span>}
                  <b className="num" style={{ minWidth: 44, textAlign: 'right' }}>{fmtHcp(c.hcp)}</b>
                </span>
              )}
            </div>
          );
        })}
        <span className="small muted">{t('today.estimate')}{cats.some((c) => c.hcp === null) ? ` ${t('today.needs')}` : ''}</span>
      </section>

      {/* 3: weekly goal */}
      <section className="card stack" aria-label={t('today.week')}>
        <span className="label">{t('today.week')}</span>
        <div className="row" style={{ alignItems: 'baseline' }}>
          <span className="big" style={{ fontSize: 48 }}>{minutes}</span>
          <span className="text-2">{t('today.of', { goal })}</span>
        </div>
        <div className="bar" role="progressbar" aria-label={t('today.week')} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={minutes}>
          <span style={{ width: `${goal ? Math.min(100, (minutes / goal) * 100) : 0}%` }} />
        </div>
      </section>

      <Link to="/session" className="btn primary block">{t('session.start')}</Link>

      {/* 4: recent sessions */}
      <section className="card stack" aria-label={t('home.sessions')}>
        <span className="label">{t('home.sessions')}</span>
        {recent.length === 0 ? <Empty text={t('home.noSessions')} link={{ to: '/session', label: t('home.buildFirst') }} /> : (
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`} className="link-row row between">
                  <span className="stack" style={{ gap: 0, minWidth: 0 }}>
                    <span>{fmtDate(s.completed_at, i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })} · <span className="num text-2">{s.minutes} {t('common.min')}</span></span>
                    <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titleOf(s.drill_ids) || t('home.noResultsInSession')}</span>
                  </span>
                  <span className="stack" style={{ gap: 0, alignItems: 'flex-end', flexShrink: 0 }}>
                    <b className="num">{fmtHcp(s.mean_hcp)}</b>
                    <span className="small muted num">{t('home.results', { count: s.n_results })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {online ? <OnlineBlocks /> : (
        <section className="card stack" aria-label={t('home.social')}>
          <span className="label">{t('home.social')}</span>
          <Empty text={supabase ? t('home.needsAccount') : t('common.localMode')} link={supabase ? { to: '/profile', label: t('auth.signIn') } : undefined} />
        </section>
      )}
    </>
  );
}

function OnlineBlocks() {
  const { t, i18n } = useTranslation();
  const ach = useRemote<AchRow[]>('home:ach', () => api.recentAchievements(), []);
  const friend = useRemote<FriendSession | null>('home:friend', api.latestFriendSession, []);
  const stand = useRemote<Standing[]>('home:standings', api.standings, []);
  const groups = groupBy(stand.value ?? []);

  return (
    <>
      {/* 5: achievements */}
      <section className="card stack" aria-label={t('home.achievements')}>
        <div className="row between"><span className="label">{t('home.achievements')}</span><Link to="/achievements" className="small">{t('achv.all')}</Link></div>
        <StaleHint r={ach} />
        {(ach.value ?? []).length === 0 ? <Empty text={t('home.noAchievements')} /> : (
          <div className="scroll-x">
            {(ach.value ?? []).map((a) => {
              const name = t(`ach.${a.key}.name`);
              return (
                <Link key={a.key} to="/achievements" className="stack" style={{ alignItems: 'center', gap: 4, width: 76, textDecoration: 'none', color: 'inherit' }}>
                  <AchIcon k={a.key} tier={a.tier} size={48} label={name} />
                  <span className="small" style={{ textAlign: 'center', lineHeight: 1.2 }}>{name}</span>
                  <span className="small muted">{a.earned_at ? fmtDate(a.earned_at, i18n.language) : ''}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 6: newest friend session */}
      <section className="card stack" aria-label={t('home.friend')}>
        <span className="label">{t('home.friend')}</span>
        <StaleHint r={friend} />
        {!friend.value ? <Empty text={t('home.noFriendSession')} link={{ to: '/social', label: t('home.addFriends') }} /> : (
          <Link to={`/friends/${friend.value.user_id}`} className="link-row row between">
            <span className="stack" style={{ gap: 0, minWidth: 0 }}>
              <span><b>{friend.value.display_name}</b> · <span className="text-2">{fmtDate(friend.value.completed_at, i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>
              <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {friend.value.minutes} {t('common.min')} · {friend.value.drill_ids.map((id) => drillById(id)?.title ?? id).join(', ')}
              </span>
            </span>
            <span className="stack" style={{ gap: 0, alignItems: 'flex-end', flexShrink: 0 }}>
              <b className="num">{fmtHcp(friend.value.mean_hcp)}</b>
              <span className="small muted num">{t('home.results', { count: friend.value.n_results })}</span>
            </span>
          </Link>
        )}
      </section>

      {/* 7: my placements per group */}
      <section className="card stack" aria-label={t('home.groups')}>
        <span className="label">{t('home.groups')}</span>
        <StaleHint r={stand} />
        {groups.length === 0 ? <Empty text={t('home.noGroups')} link={{ to: '/social?tab=groups', label: t('social.newGroup') }} /> : groups.map(([g, rows]) => (
          <div key={g.group_id} className="stack" style={{ gap: 6 }}>
            <Link to={`/groups/${g.group_id}`} className="row between" style={{ color: 'inherit', textDecoration: 'none' }}><b>{g.group_name}</b><span className="muted">›</span></Link>
            <ul className="list">
              {rows.map((r) => (
                <li key={r.board} className="row between">
                  <span className="row" style={{ gap: 8 }}>
                    {r.board !== 'overall' && <span className="dot" style={{ background: CAT_COLOR[r.board as keyof typeof CAT_COLOR] }} />}
                    <span>{t(`board.${r.board}`)}</span>
                    {r.title && <TitleIcon board={r.board as TitleBoard} type={r.title} size={22} />}
                  </span>
                  {r.eligible && r.my_rank != null
                    ? <b className="num">{r.my_rank} / {r.ranked_count}</b>
                    : <span className="small muted" title={r.board === 'overall' ? t('group.eligibilityOverall') : t('group.eligibility')}>{t('group.notRanked')}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.some(([, rows]) => rows.some((r) => !r.eligible)) && <span className="small muted">{t('group.eligibility')}</span>}
      </section>
    </>
  );
}

function groupBy(rows: Standing[]): [Standing, Standing[]][] {
  const m = new Map<string, Standing[]>();
  for (const r of rows) m.set(r.group_id, [...(m.get(r.group_id) ?? []), r]);
  return [...m.values()].map((rs) => [rs[0], rs]);
}
