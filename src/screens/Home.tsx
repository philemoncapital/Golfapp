import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, getSettings, type LocalResult, type LocalSession, type LocalTemplate } from '../lib/db';
import { listTemplates, loadTemplate } from '../lib/templates';
import { HcpBreakdown } from '../components/HcpBreakdown';
import { FourWeeksChart } from '../components/FourWeeksChart';
import { SessionTile } from '../components/SessionTile';
import { useLive } from '../lib/useLive';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';
import { api, type FriendSession, type Standing } from '../lib/api';
import { DRILLS, CAT_COLOR, drillById } from '../lib/drills';
import { categoryHcps, overallHcp } from '../engine/handicap';
import { practiceMinutes, sessionSummaries, dailyMinutes, minutesByCategory } from '../engine/stats';
import type { AchRow } from '../engine/achievements';
import { fmtDate, fmtHcp, weekStart, locale } from '../lib/format';
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
  const online = isDemo || (!!supabase && !!user);

  const nav = useNavigate();
  const templates = useLive(listTemplates, [], [] as LocalTemplate[]);
  const [info, setInfo] = useState(false);
  const cats = categoryHcps(DRILLS, results);
  const overall = overallHcp(cats);
  const real = settings?.real_hcp ?? null;
  const minutes = practiceMinutes(results, DRILLS, weekStart());
  const goal = settings?.weekly_goal_min ?? 180;
  const recent = sessionSummaries(sessions, results, DRILLS, 3);
  const days = dailyMinutes(results, 28);
  const since28 = new Date(); since28.setHours(0, 0, 0, 0); since28.setDate(since28.getDate() - 27);
  const catMin = minutesByCategory(results, since28);
  const titleOf = (ids: string[]) => ids.map((id) => drillById(id)?.title ?? id).join(', ');
  const open = async (id: string) => { await loadTemplate(id); nav('/session'); };

  return (
    <>
      <div className="row between">
        <h1>{t('nav.home')}</h1>
        <span className="small muted">{new Date().toLocaleDateString(locale(i18n.language), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>

      {/* Handicap: training vs real, composition per category, time share */}
      <section className="card hero stack" aria-label={t('today.trainingHcp')}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="stack" style={{ gap: 2 }}>
            <span className="label">{t('home.training')}</span>
            <span className="big grad-text">{fmtHcp(overall)}</span>
          </div>
          <div className="stack" style={{ gap: 2, alignItems: 'flex-end' }}>
            <span className="label">{t('home.real')}</span>
            {real === null ? <Link to="/profile" className="small">{t('home.setHcpShort')}</Link> : <span className="big" style={{ color: 'var(--text-2)' }}>{fmtHcp(real)}</span>}
          </div>
        </div>
        <HcpBreakdown cats={cats} real={real} minutes={catMin} />
        <button className="linkbtn small" style={{ alignSelf: 'flex-start', color: 'var(--muted)' }} onClick={() => setInfo(!info)} aria-expanded={info}>ⓘ {t('home.howCalc')}</button>
        {info && <span className="small muted">{t('today.estimate')} {t('today.needs')}</span>}
      </section>

      {/* Saved sessions as horizontally scrolling tiles */}
      <section className="stack" aria-label={t('session.savedList')}>
        <div className="row between"><span className="label">{t('session.savedList')}</span><Link to="/session" className="small">{t('home.edit')}</Link></div>
        <div className="tile-row" key={templates.length}>
          {templates.map((tp) => <SessionTile key={tp.id} tpl={tp} onOpen={() => open(tp.id)} />)}
          <Link to="/session" className="tile tile-new">＋ {t('session.newTile')}</Link>
        </div>
      </section>

      {/* Practice: this week vs goal + last 4 weeks */}
      <section className="card stack" aria-label={t('home.train4w')}>
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <span className="label">{t('home.train4w')}</span>
          <span className="small text-2 num"><b style={{ color: 'var(--text)', fontSize: 18 }}>{minutes}</b> / {goal} {t('common.min')}</span>
        </div>
        <div className="bar" role="progressbar" aria-label={t('today.week')} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={minutes}>
          <span style={{ width: `${goal ? Math.min(100, (minutes / goal) * 100) : 0}%` }} />
        </div>
        <FourWeeksChart days={days} goal={goal} />
      </section>

      {/* Recent sessions */}
      <section className="card stack" aria-label={t('home.sessions')}>
        <span className="label">{t('home.sessions')}</span>
        {recent.length === 0 ? <Empty text={t('home.noSessions')} link={{ to: '/session', label: t('home.buildFirst') }} /> : (
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`} className="link-row row between">
                  <span className="stack" style={{ gap: 0, minWidth: 0 }}>
                    <span>{fmtDate(s.completed_at, i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })} · <span className="num text-2">{s.minutes} {t('common.min')}</span></span>
                    <span className="small muted ellipsis">{titleOf(s.drill_ids) || t('home.noResultsInSession')}</span>
                  </span>
                  <b className="num" style={{ flexShrink: 0 }}>{fmtHcp(s.mean_hcp)}</b>
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
      </section>
    </>
  );
}

function groupBy(rows: Standing[]): [Standing, Standing[]][] {
  const m = new Map<string, Standing[]>();
  for (const r of rows) m.set(r.group_id, [...(m.get(r.group_id) ?? []), r]);
  return [...m.values()].map((rs) => [rs[0], rs]);
}
