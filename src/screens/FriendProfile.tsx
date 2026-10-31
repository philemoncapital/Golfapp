import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';
import { useUser } from '../lib/auth';
import { useRemote } from '../lib/useRemote';
import { ApiError } from '../lib/api';
import { DRILLS, drillById, CAT_COLOR } from '../lib/drills';
import { categoryHcps, overallHcp } from '../engine/handicap';
import { personalBests } from '../engine/stats';
import type { DrillResult } from '../engine/types';
import { fmtDate, fmtHcp } from '../lib/format';
import { StaleHint, Empty } from '../components/Ui';
import { SocialGate } from './Social';

interface FriendData {
  name: string; real_hcp: number | null; visibility: string;
  results: (DrillResult & { session_id: string | null; drill_hcp: number | null })[];
  sessions: { id: string; completed_at: string }[];
  badges: { key: string; tier: string | null; earned_at: string | null }[];
}

async function loadFriend(id: string): Promise<FriendData> {
  if (isDemo) return (await import('../demo/api')).loadFriendDemo(id) as Promise<FriendData>;
  if (!supabase) throw new ApiError('signed_out');
  if (!navigator.onLine) throw new ApiError('offline');
  const [p, v, r, s, b] = await Promise.all([
    supabase.from('profile_public').select('display_name, real_hcp').eq('id', id).maybeSingle(),
    supabase.from('profiles').select('results_visibility').eq('id', id).maybeSingle(),
    supabase.from('drill_results').select('drill_id, created_at, input, session_id, drill_hcp').eq('user_id', id).order('created_at', { ascending: false }).limit(500),
    supabase.from('sessions').select('id, completed_at').eq('user_id', id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(5),
    supabase.from('user_achievements').select('key, tier, earned_at').eq('user_id', id).not('earned_at', 'is', null),
  ]);
  const err = p.error ?? v.error ?? r.error ?? s.error ?? b.error;
  if (err) throw new ApiError(err.message, err.code);
  return {
    name: p.data?.display_name ?? '–', real_hcp: p.data?.real_hcp ?? null, visibility: v.data?.results_visibility ?? 'nobody',
    results: (r.data ?? []) as FriendData['results'], sessions: (s.data ?? []) as FriendData['sessions'], badges: b.data ?? [],
  };
}

export default function FriendProfile() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const user = useUser();
  const gate = SocialGate({ user });
  const data = useRemote<FriendData>(user ? `friend:${id}` : null, () => loadFriend(id), [id, user?.id]);
  const back = <Link to="/social" className="small">← {t('social.friends')}</Link>;
  if (gate) return <>{back}{gate}</>;
  const d = data.value;
  if (!d) return <>{back}<p className="small muted">{data.error ?? t('common.loading')}</p></>;

  const cats = categoryHcps(DRILLS, d.results);
  const overall = overallHcp(cats);
  const pbs = personalBests(d.results).slice(0, 5);

  return (
    <>
      {back}
      <h1>{d.name}</h1>
      <StaleHint r={data} />
      {d.results.length === 0 ? <Empty text={d.visibility === 'nobody' ? t('friend.private', { name: d.name }) : t('friend.none')} /> : (
        <>
          <section className="card stack">
            <div className="grid2">
              <div className="stack" style={{ gap: 4 }}><span className="label">{t('friend.trainingHcp')}</span><span className="big" style={{ fontSize: 44 }}>{fmtHcp(overall)}</span></div>
              <div className="stack" style={{ gap: 4 }}><span className="label">{t('friend.realHcp')}</span><span className="big" style={{ fontSize: 44 }}>{d.real_hcp == null ? <span className="small muted">{t('friend.hidden')}</span> : fmtHcp(d.real_hcp)}</span></div>
            </div>
            <hr className="divider" />
            {cats.map((c) => (
              <div key={c.category} className="row between">
                <span className="row"><span className="dot" style={{ background: CAT_COLOR[c.category] }} />{t(`cat.${c.category}`)}</span>
                <b className="num">{fmtHcp(c.hcp)}</b>
              </div>
            ))}
            <span className="small muted">{t('today.estimate')}</span>
          </section>

          <section className="card stack" aria-label={t('friend.recent')}>
            <span className="label">{t('friend.recent')}</span>
            {d.sessions.length === 0 ? <Empty text={t('friend.none')} /> : (
              <ul className="list">
                {d.sessions.map((s) => {
                  const rs = d.results.filter((r) => r.session_id === s.id);
                  const hs = rs.map((r) => r.drill_hcp).filter((x): x is number => x != null);
                  return (
                    <li key={s.id} className="row between">
                      <span className="stack" style={{ gap: 0 }}>
                        <span>{fmtDate(s.completed_at, i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="small muted">{[...new Set(rs.map((r) => drillById(r.drill_id)?.title ?? r.drill_id))].join(', ') || '–'}</span>
                      </span>
                      <b className="num">{hs.length ? fmtHcp(Math.round((hs.reduce((a, b) => a + Number(b), 0) / hs.length) * 10) / 10) : '–'}</b>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card stack" aria-label={t('friend.pbs')}>
            <span className="label">{t('friend.pbs')}</span>
            <ul className="list">
              {pbs.map((p) => (
                <li key={p.drill_id} className="row between">
                  <span>{drillById(p.drill_id)?.title ?? p.drill_id}</span>
                  <span className="small text-2 num">{fmtDate(p.created_at, i18n.language)} · <b>{fmtHcp(p.hcp)}</b></span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {d.badges.length > 0 && (
        <section className="card stack" aria-label={t('friend.badges')}>
          <span className="label">{t('friend.badges')}</span>
          <span className="small text-2">{d.badges.map((b) => t(`ach.${b.key}.name`) + (b.tier ? ` (${t(`tier.${b.tier}`)})` : '')).join(' · ')}</span>
        </section>
      )}
    </>
  );
}
