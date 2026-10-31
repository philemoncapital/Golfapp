import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError, type Friend, type MyGroup, type SearchHit } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import { useUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { StaleHint, Empty } from '../components/Ui';

export function useErrorText() {
  const { t } = useTranslation();
  return (e: unknown) => {
    const m = e instanceof ApiError || e instanceof Error ? e.message : String(e);
    if (m === 'rate_limited') return t('common.rateLimited');
    if (m === 'offline') return t('sync.offline');
    return t('common.error', { msg: m });
  };
}

/** Shown instead of social content when there is no backend or nobody is signed in. Returns true when blocked. */
export function SocialGate({ user }: { user: ReturnType<typeof useUser> }) {
  const { t } = useTranslation();
  if (!supabase) return <Empty text={t('common.localMode')} />;
  if (user === null) return <Empty text={t('common.signedOut')} link={{ to: '/profile', label: t('auth.signIn') }} />;
  return null;
}

export default function Social() {
  const { t } = useTranslation();
  const user = useUser();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'groups' ? 'groups' : 'friends';
  const gate = SocialGate({ user });
  return (
    <>
      <h1>{t('social.title')}</h1>
      {gate ?? (user && (
        <>
          <div className="row" role="tablist">
            {(['friends', 'groups'] as const).map((k) => (
              <button key={k} role="tab" className="chip" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setParams(k === 'groups' ? { tab: k } : {})}>{t(`social.${k}`)}</button>
            ))}
          </div>
          {tab === 'friends' ? <Friends /> : <Groups />}
        </>
      ))}
    </>
  );
}

function Friends() {
  const { t } = useTranslation();
  const err = useErrorText();
  const friends = useRemote<Friend[]>('friends', api.myFriends);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (f: () => Promise<unknown>) => {
    setMsg(null);
    try { await f(); friends.reload(); } catch (e) { setMsg(err(e)); }
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => setHits(await api.search(q)));
  };
  const list = friends.value ?? [];
  const incoming = list.filter((f) => f.status === 'pending' && f.direction === 'incoming');
  const outgoing = list.filter((f) => f.status !== 'accepted' && f.direction === 'outgoing');
  const accepted = list.filter((f) => f.status === 'accepted');

  return (
    <>
      <form className="card stack" onSubmit={search} role="search">
        <label className="label" htmlFor="q">{t('social.search')}</label>
        <div className="row">
          <input id="q" className="field" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" minLength={2} maxLength={80} />
          <button className="btn" type="submit" aria-label={t('social.search')} disabled={q.trim().length < 2}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg></button>
        </div>
        <span className="small muted">{t('social.searchHint')}</span>
        {hits && (hits.length === 0 ? <span className="small text-2">{t('social.noResults')}</span> : (
          <ul className="list">
            {hits.map((h) => (
              <li key={h.id} className="row between">
                <span>{h.display_name}</span>
                {h.relation === 'none' || h.relation === 'incoming'
                  ? <button className="btn" type="button" onClick={() => run(async () => { const r = await api.requestFriend(h.id); setHits(hits.map((x) => (x.id === h.id ? { ...x, relation: r } : x))); })}>{h.relation === 'incoming' ? t('social.accept') : t('social.add')}</button>
                  : <span className="small muted">{h.relation === 'friends' ? t('social.isFriend') : t('social.requested')}</span>}
              </li>
            ))}
          </ul>
        ))}
      </form>
      {msg && <p className="small warn" role="alert">{msg}</p>}
      <StaleHint r={friends} />

      {incoming.length > 0 && (
        <section className="card stack" aria-label={t('social.incoming')}>
          <span className="label">{t('social.incoming')}</span>
          <ul className="list">
            {incoming.map((f) => (
              <li key={f.friendship_id} className="row between">
                <span>{f.display_name}</span>
                <span className="row" style={{ gap: 6 }}>
                  <button className="btn" onClick={() => run(() => api.answerFriend(f.friendship_id, false))}>{t('social.decline')}</button>
                  <button className="btn on" onClick={() => run(() => api.answerFriend(f.friendship_id, true))}>{t('social.accept')}</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack" aria-label={t('social.friends')}>
        <span className="label">{t('social.friends')}</span>
        {accepted.length === 0 ? <span className="small text-2">{t('social.noFriends')}</span> : (
          <ul className="list">
            {accepted.map((f) => (
              <li key={f.friendship_id} className="row between">
                <Link to={`/friends/${f.user_id}`} className="link-row">{f.display_name} <span aria-hidden="true" className="muted">›</span></Link>
                <button className="btn" aria-label={`${t('social.remove')}: ${f.display_name}`} onClick={() => { if (confirm(t('social.confirmRemove', { name: f.display_name }))) void run(() => api.removeFriend(f.friendship_id)); }}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="card stack" aria-label={t('social.outgoing')}>
          <span className="label">{t('social.outgoing')}</span>
          <ul className="list">
            {outgoing.map((f) => (
              <li key={f.friendship_id} className="row between">
                <span className="text-2">{f.display_name}</span>
                <button className="btn" onClick={() => run(() => api.removeFriend(f.friendship_id))}>{t('common.cancel')}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Groups() {
  const { t } = useTranslation();
  const err = useErrorText();
  const nav = useNavigate();
  const groups = useRemote<MyGroup[]>('groups', api.myGroups);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const list = groups.value ?? [];
  const invites = list.filter((g) => g.my_status === 'invited');
  const mine = list.filter((g) => g.my_status === 'active');
  const run = async (f: () => Promise<unknown>) => { setMsg(null); try { await f(); groups.reload(); } catch (e) { setMsg(err(e)); } };
  const create = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => { const id = await api.createGroup(name.trim()); setName(''); nav(`/groups/${id}`); });
  };
  return (
    <>
      {msg && <p className="small warn" role="alert">{msg}</p>}
      <StaleHint r={groups} />
      {invites.length > 0 && (
        <section className="card stack" aria-label={t('social.invitations')}>
          <span className="label">{t('social.invitations')}</span>
          <ul className="list">
            {invites.map((g) => (
              <li key={g.group_id} className="row between">
                <span>{g.name}</span>
                <span className="row" style={{ gap: 6 }}>
                  <button className="btn" onClick={() => run(() => api.respondInvite(g.group_id, false))}>{t('social.decline')}</button>
                  <button className="btn on" onClick={() => run(() => api.respondInvite(g.group_id, true))}>{t('social.join')}</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card stack" aria-label={t('social.groups')}>
        <span className="label">{t('social.groups')}</span>
        {mine.length === 0 ? <span className="small text-2">{t('social.noGroups')}</span> : (
          <ul className="list">
            {mine.map((g) => (
              <li key={g.group_id}>
                <Link to={`/groups/${g.group_id}`} className="link-row row between">
                  <span>{g.name}</span><span className="small muted">{t('social.members', { n: g.member_count })} ›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form className="card stack" onSubmit={create}>
        <label className="label" htmlFor="gname">{t('social.newGroup')}</label>
        <input id="gname" className="field" placeholder={t('social.groupName')} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} />
        <button className="btn" type="submit" disabled={name.trim().length < 2}>{t('social.create')}</button>
      </form>
    </>
  );
}
