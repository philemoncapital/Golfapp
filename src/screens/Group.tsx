import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type Board, type BoardRow, type FeedItem, type Friend, type Member, type MyGroup, type Title } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { drillById } from '../lib/drills';
import { fmtDate, fmtHcp } from '../lib/format';
import { TitleIcon, type TitleBoard } from '../components/TitleIcon';
import { StaleHint, Empty } from '../components/Ui';
import { SocialGate, useErrorText } from './Social';

const BOARDS: Board[] = ['overall', 'tee', 'approach', 'short', 'putting', 'activity'];

export default function Group() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const user = useUser();
  const gate = SocialGate({ user });
  const groups = useRemote<MyGroup[]>(user ? 'groups' : null, api.myGroups, [user?.id]);
  const g = groups.value?.find((x) => x.group_id === id);
  if (gate) return <><Link to="/social?tab=groups" className="small">← {t('social.groups')}</Link>{gate}</>;
  return (
    <>
      <Link to="/social?tab=groups" className="small">← {t('social.groups')}</Link>
      <h1>{g?.name ?? (groups.loading ? t('common.loading') : '–')}</h1>
      {g && g.my_status === 'active' && <GroupBody g={g} reloadGroups={groups.reload} />}
    </>
  );
}

function GroupBody({ g, reloadGroups }: { g: MyGroup; reloadGroups: () => void }) {
  const { t, i18n } = useTranslation();
  const [board, setBoard] = useState<Board>('overall');
  const rows = useRemote<BoardRow[]>(`board:${g.group_id}:${board}`, () => api.leaderboard(g.group_id, board), [board]);
  const titles = useRemote<Title[]>(`titles:${g.group_id}`, () => api.titles(g.group_id));
  const feed = useRemote<FeedItem[]>(`feed:${g.group_id}`, () => api.feed(g.group_id));
  const members = useRemote<Member[]>(`members:${g.group_id}`, () => api.members(g.group_id));
  const nameOf = (uid: string) => members.value?.find((m) => m.user_id === uid)?.display_name ?? '…';
  const ranked = (rows.value ?? []).filter((r) => r.eligible);
  const unranked = (rows.value ?? []).filter((r) => !r.eligible);
  const fmtVal = (r: BoardRow) => (board === 'activity' ? `${r.value ?? 0} ${t('common.min')}` : fmtHcp(r.value));
  const rule = board === 'activity' ? t('group.activityRule') : board === 'overall' ? t('group.eligibilityOverall') : t('group.eligibility');

  return (
    <>
      <section className="card stack" aria-label={t('group.leaderboard')}>
        <div className="row between"><span className="label">{t('group.leaderboard')}</span><span className="small muted">{t('group.last30')}</span></div>
        <div className="scroll-x" role="tablist">
          {BOARDS.map((b) => <button key={b} role="tab" className="chip" aria-selected={board === b} aria-pressed={board === b} onClick={() => setBoard(b)}>{t(`board.${b}`)}</button>)}
        </div>
        <StaleHint r={rows} />
        {ranked.length === 0 && !rows.loading && <Empty text={rule} />}
        <ol className="list">
          {ranked.map((r) => (
            <li key={r.user_id} className="row between">
              <span className="row" style={{ gap: 8 }}>
                <span className="rank">{r.rank}</span>
                <span className={r.is_me ? 'me' : undefined} style={{ fontWeight: r.is_me ? 600 : 400 }}>{r.is_me ? t('common.you') : r.display_name}</span>
                {r.title && board !== 'activity' && <TitleIcon board={board as TitleBoard} type={r.title} size={22} label={false} />}
              </span>
              <b className="num">{fmtVal(r)}</b>
            </li>
          ))}
        </ol>
        {unranked.length > 0 && (
          <>
            <span className="label">{t('group.notRanked')}</span>
            <span className="small muted">{rule}</span>
            <ul className="list">
              {unranked.map((r) => (
                <li key={r.user_id} className="row between text-2">
                  <span className={r.is_me ? 'me' : undefined}>{r.is_me ? t('common.you') : r.display_name}</span>
                  {board !== 'activity' && <span className="small muted num">{r.n_results} / {r.n_drills}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card stack" aria-label={t('group.titles')}>
        <span className="label">{t('group.titles')}</span>
        {!g.titles_enabled ? <Empty text={t('group.titlesOff')} /> : (titles.value ?? []).length === 0 ? <Empty text={t('group.noTitles')} /> : (
          <ul className="list">
            {(titles.value ?? []).map((x) => (
              <li key={`${x.board}-${x.title_type}`} className="row between">
                <TitleIcon board={x.board} type={x.title_type} />
                <span className="small text-2">{nameOf(x.user_id)} · {t(`board.${x.board}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack" aria-label={t('group.feed')}>
        <span className="label">{t('group.feed')}</span>
        {(feed.value ?? []).length === 0 ? <Empty text={t('group.noFeed')} /> : (
          <ul className="list">
            {(feed.value ?? []).map((e, i) => (
              <li key={i} className="stack" style={{ gap: 0, justifyContent: 'center' }}>
                <span className="small"><b>{e.display_name}</b> {feedText(e, t)}</span>
                <span className="small muted">{fmtDate(e.at, i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Members g={g} members={members} reloadGroups={reloadGroups} reloadTitles={titles.reload} />
    </>
  );
}

function feedText(e: FeedItem, t: ReturnType<typeof useTranslation>['t']) {
  const p = e.payload;
  switch (e.kind) {
    case 'session': return t('group.ev.session', { min: p.minutes, n: p.drills });
    case 'personal_best': return t('group.ev.personal_best', { drill: drillById(String(p.drill_id))?.title ?? p.drill_id });
    case 'title': return t('group.ev.title', { title: t(`titles.${p.board}_${p.title_type}`) });
    case 'achievement': return t('group.ev.achievement', { name: t(`ach.${p.key}.name`) });
  }
}

function Members({ g, members, reloadGroups, reloadTitles }: { g: MyGroup; members: ReturnType<typeof useRemote<Member[]>>; reloadGroups: () => void; reloadTitles: () => void }) {
  const { t } = useTranslation();
  const err = useErrorText();
  const nav = useNavigate();
  const user = useUser();
  const friends = useRemote<Friend[]>(g.my_role === 'admin' ? 'friends' : null, api.myFriends);
  const [msg, setMsg] = useState<string | null>(null);
  const [pick, setPick] = useState('');
  const list = members.value ?? [];
  const inGroup = new Set(list.map((m) => m.user_id));
  const invitable = (friends.value ?? []).filter((f) => f.status === 'accepted' && !inGroup.has(f.user_id));
  const run = async (f: () => Promise<unknown>) => { setMsg(null); try { await f(); members.reload(); reloadGroups(); } catch (e) { setMsg(err(e)); } };
  const admin = g.my_role === 'admin';

  return (
    <section className="card stack" aria-label={t('group.members')}>
      <span className="label">{t('group.members')}</span>
      {msg && <span className="small warn" role="alert">{msg}</span>}
      <ul className="list">
        {list.map((m) => (
          <li key={m.user_id} className="row between">
            <span className="stack" style={{ gap: 0 }}>
              {m.user_id === user?.id ? <span className="me">{t('common.you')}</span> : <Link to={`/friends/${m.user_id}`} style={{ color: 'inherit' }}>{m.display_name}</Link>}
              <span className="small muted">{[m.is_owner && t('group.owner'), m.role === 'admin' && !m.is_owner && t('group.admin'), m.status === 'invited' && t('group.invited')].filter(Boolean).join(' · ')}</span>
            </span>
            {admin && !m.is_owner && m.user_id !== user?.id && (
              <span className="row" style={{ gap: 6 }}>
                {g.is_owner && m.status === 'active' && (
                  <button className="btn" onClick={() => run(() => api.setRole(g.group_id, m.user_id, m.role === 'admin' ? 'member' : 'admin'))}>{m.role === 'admin' ? t('group.makeMember') : t('group.makeAdmin')}</button>
                )}
                <button className="btn" aria-label={`${t('group.removeMember')}: ${m.display_name}`} onClick={() => run(() => api.removeMember(g.group_id, m.user_id))}>✕</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {admin && (
        <>
          <hr className="divider" />
          <label className="label" htmlFor="inv">{t('group.invite')}</label>
          {invitable.length === 0 ? <Empty text={t('group.noInvitable')} link={{ to: '/social', label: t('social.friends') }} /> : (
            <div className="row">
              <select id="inv" className="field" value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">–</option>
                {invitable.map((f) => <option key={f.user_id} value={f.user_id}>{f.display_name}</option>)}
              </select>
              <button className="btn" disabled={!pick} onClick={() => run(async () => { await api.invite(g.group_id, pick); setPick(''); })}>{t('social.add')}</button>
            </div>
          )}
          <div className="row between">
            <span className="small">{t('group.titlesToggle')}</span>
            <span className="row" style={{ gap: 6 }}>
              {[true, false].map((on) => (
                <button key={String(on)} className="chip" aria-pressed={g.titles_enabled === on} onClick={() => run(async () => { await api.setTitles(g.group_id, on); reloadTitles(); })}>{on ? t('group.on') : t('group.off')}</button>
              ))}
            </span>
          </div>
        </>
      )}
      <button className="btn" onClick={() => { if (confirm(t('group.confirmLeave'))) void run(async () => { await api.leaveGroup(g.group_id); nav('/social?tab=groups'); }); }}>{t('group.leave')}</button>
    </section>
  );
}
