/** Demo replacement for lib/api (same surface). In-memory, nothing leaves the device. */
import type { Board as ApiBoard, BoardRow, DrillBoardRow, FeedItem, Friend, FriendSession, Member, MyGroup, Relation, SearchHit, Standing, Title } from '../lib/api';
import type { AchRow } from '../engine/achievements';
import { db } from '../lib/db';
import { DEMO_ME } from '../lib/demo';
import { drillById } from '../lib/drills';
import { resultHcp } from '../engine/handicap';
import { practiceMinutes } from '../engine/stats';
import { getWorld, PLAYERS } from './world';
import { achievements, boardRow, isPb, rankBoard, titlesFor, type R, type S } from './compute';

const DAY = 864e5;
const now = () => Date.now();
const name = (id: string) => PLAYERS.find((p) => p.id === id)?.name ?? '?';
const ids = (n: string[]) => n.map((x) => PLAYERS.find((p) => p.name === x)!.id);

interface G { group_id: string; name: string; owner: string; members: string[]; admins: string[]; invited: string[]; titles_enabled: boolean }
const groups: G[] = [
  { group_id: 'd1000000-0000-4000-8000-000000000001', name: 'Sonntagsrunde', owner: DEMO_ME, members: PLAYERS.map((p) => p.id), admins: [DEMO_ME], invited: [], titles_enabled: true },
  { group_id: 'd1000000-0000-4000-8000-000000000002', name: 'Mittwochs-Neun', owner: ids(['Lena'])[0], members: [DEMO_ME, ...ids(['Lena', 'Jonas', 'Tim', 'Clara', 'Paul'])], admins: ids(['Lena']), invited: [], titles_enabled: true },
  { group_id: 'd1000000-0000-4000-8000-000000000003', name: 'Firmen-Cup', owner: ids(['Max'])[0], members: ids(['Max', 'Sophie', 'Felix']), admins: ids(['Max']), invited: [DEMO_ME], titles_enabled: true },
];
let fid = 100;
const friends: Friend[] = [
  ...PLAYERS.filter((p) => p.id !== DEMO_ME).map((p, i) => ({ friendship_id: i + 1, user_id: p.id, display_name: p.name, status: 'accepted' as const, direction: (i % 2 ? 'incoming' : 'outgoing') as Friend['direction'], created_at: new Date(now() - 80 * DAY).toISOString() })),
  { friendship_id: 50, user_id: 'd0000000-0000-4000-8000-0000000000a1', display_name: 'Mara', status: 'pending', direction: 'incoming', created_at: new Date(now() - DAY).toISOString() },
  { friendship_id: 51, user_id: 'd0000000-0000-4000-8000-0000000000a2', display_name: 'Ole', status: 'pending', direction: 'outgoing', created_at: new Date(now() - 2 * DAY).toISOString() },
];
const STRANGERS = [['d0000000-0000-4000-8000-0000000000a1', 'Mara'], ['d0000000-0000-4000-8000-0000000000a2', 'Ole'], ['d0000000-0000-4000-8000-0000000000a3', 'Nora'], ['d0000000-0000-4000-8000-0000000000a4', 'Erik']];

/** All results: generated friends + my own from the demo database (so sessions played in demo mode count). */
async function allData(): Promise<{ results: R[]; sessions: S[] }> {
  const w = getWorld();
  const myR = (await db.results.toArray()).map((r) => {
    const d = drillById(r.drill_id);
    let h: number | null = null; try { h = d ? resultHcp(d, r.input) : null; } catch { /* invalid */ }
    return { id: r.id, user_id: DEMO_ME, session_id: r.session_id, drill_id: r.drill_id, input: r.input, created_at: r.created_at, drill_hcp: h };
  });
  const myS = (await db.sessions.where('status').equals('completed').toArray()).map((s) => ({ id: s.id, user_id: DEMO_ME, started_at: s.started_at ?? s.created_at, completed_at: s.completed_at! }));
  return { results: [...w.results.filter((r) => r.user_id !== DEMO_ME), ...myR], sessions: [...w.sessions.filter((s) => s.user_id !== DEMO_ME), ...myS] };
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
async function groupTitles(g: G, results: R[]) {
  const out: (Title & { group_id: string })[] = [];
  if (!g.titles_enabled) return out;
  for (const b of ['tee', 'approach', 'short', 'putting', 'overall'] as const) {
    const t = titlesFor(rankBoard(g.members.map((u) => boardRow(u, results, b, now())), b));
    for (const type of ['leader', 'last'] as const) {
      const u = t[type]; if (!u) continue;
      out.push({ group_id: g.group_id, board: b, title_type: type, user_id: u, since: new Date(now() - (3 + (hash(g.group_id + b + type) % 38)) * DAY).toISOString().slice(0, 10) });
    }
  }
  return out;
}
async function allTitles(results: R[]) { return (await Promise.all(groups.map((g) => groupTitles(g, results)))).flat(); }

async function achOf(user: string, results: R[], sessions: S[]): Promise<AchRow[]> {
  const titles = (await allTitles(results)).filter((t) => t.user_id === user).map((t) => ({ board: t.board, type: t.title_type, since: t.since }));
  const p = PLAYERS.find((x) => x.id === user);
  const settings = await db.settings.get('me');
  const owned = groups.find((g) => g.owner === user && g.members.length >= 3);
  return achievements({
    results: results.filter((r) => r.user_id === user), sessions: sessions.filter((s) => s.user_id === user),
    real_hcp: user === DEMO_ME ? settings?.real_hcp ?? p?.hcp ?? null : p?.hcp ?? null, weekly_goal_min: user === DEMO_ME ? settings?.weekly_goal_min ?? 180 : 120,
    friends_since: new Date(now() - 80 * DAY).toISOString(), captain_since: owned ? new Date(now() - 75 * DAY).toISOString() : null, titles, now: now(),
  });
}

const active = (g: G) => g.members.includes(DEMO_ME);
const groupById = (id: string) => { const g = groups.find((x) => x.group_id === id); if (!g || !active(g)) throw new Error('not a member of this group'); return g; };

export const demoApi = {
  myFriends: async () => friends.filter((f) => f.status !== 'declined'),
  search: async (q: string): Promise<SearchHit[]> => {
    const s = q.trim().toLowerCase();
    const pool: [string, string][] = [...PLAYERS.filter((p) => p.id !== DEMO_ME).map((p) => [p.id, p.name] as [string, string]), ...(STRANGERS as [string, string][])];
    return pool.filter(([, n]) => n.toLowerCase().startsWith(s)).map(([id, n]) => {
      const f = friends.find((x) => x.user_id === id);
      return { id, display_name: n, relation: (f ? (f.status === 'accepted' ? 'friends' : f.direction) : 'none') as Relation };
    });
  },
  requestFriend: async (target: string): Promise<Relation> => {
    const f = friends.find((x) => x.user_id === target);
    if (f?.direction === 'incoming') { f.status = 'accepted'; return 'friends'; }
    if (f) return f.status === 'accepted' ? 'friends' : 'outgoing';
    friends.push({ friendship_id: fid++, user_id: target, display_name: STRANGERS.find(([i]) => i === target)?.[1] ?? name(target), status: 'pending', direction: 'outgoing', created_at: new Date().toISOString() });
    return 'outgoing';
  },
  answerFriend: async (id: number, accept: boolean) => { const f = friends.find((x) => x.friendship_id === id); if (f) f.status = accept ? 'accepted' : 'declined'; },
  removeFriend: async (id: number) => { const i = friends.findIndex((x) => x.friendship_id === id); if (i >= 0) friends.splice(i, 1); },
  myGroups: async (): Promise<MyGroup[]> => groups.filter((g) => active(g) || g.invited.includes(DEMO_ME)).map((g) => ({
    group_id: g.group_id, name: g.name, my_role: g.admins.includes(DEMO_ME) ? 'admin' : 'member', my_status: active(g) ? 'active' : 'invited',
    titles_enabled: g.titles_enabled, member_count: g.members.length, is_owner: g.owner === DEMO_ME,
  })),
  createGroup: async (n: string) => { const id = crypto.randomUUID(); groups.push({ group_id: id, name: n, owner: DEMO_ME, members: [DEMO_ME], admins: [DEMO_ME], invited: [], titles_enabled: true }); return id; },
  invite: async (group: string, user: string) => { const g = groupById(group); if (!g.invited.includes(user) && !g.members.includes(user)) g.invited.push(user); },
  respondInvite: async (group: string, accept: boolean) => {
    const g = groups.find((x) => x.group_id === group); if (!g) return;
    g.invited = g.invited.filter((u) => u !== DEMO_ME); if (accept) g.members.push(DEMO_ME);
  },
  leaveGroup: async (group: string) => { const g = groupById(group); g.members = g.members.filter((u) => u !== DEMO_ME); },
  removeMember: async (group: string, user: string) => { const g = groupById(group); g.members = g.members.filter((u) => u !== user); g.invited = g.invited.filter((u) => u !== user); },
  setRole: async (group: string, user: string, role: 'admin' | 'member') => { const g = groupById(group); g.admins = role === 'admin' ? [...g.admins, user] : g.admins.filter((u) => u !== user); },
  setTitles: async (group: string, enabled: boolean) => { groupById(group).titles_enabled = enabled; },
  members: async (group: string): Promise<Member[]> => {
    const g = groupById(group);
    return [...g.members.map((u) => ({ user_id: u, status: 'active' as const })), ...g.invited.map((u) => ({ user_id: u, status: 'invited' as const }))].map((m) => ({
      ...m, display_name: name(m.user_id), role: g.admins.includes(m.user_id) ? 'admin' : 'member', is_owner: g.owner === m.user_id, joined_at: new Date(now() - 70 * DAY).toISOString(),
    }));
  },
  leaderboard: async (group: string, board: ApiBoard): Promise<BoardRow[]> => {
    const g = groupById(group); const { results } = await allData();
    const titles = await groupTitles(g, results);
    return rankBoard(g.members.map((u) => boardRow(u, results, board, now())), board)
      .map((r) => ({ ...r, display_name: name(r.user_id), is_me: r.user_id === DEMO_ME, title: titles.find((t) => t.board === board && t.user_id === r.user_id)?.title_type ?? null }));
  },
  drillBoard: async (group: string, drill: string): Promise<DrillBoardRow[]> => {
    const g = groupById(group); const { results } = await allData();
    const score = (r: R) => (r.input.kind === 'value' ? r.input.value : null);
    const best = (rs: R[]) => [...rs].sort((a, b) => (a.drill_hcp as number) - (b.drill_hcp as number) || a.created_at.localeCompare(b.created_at))[0];
    const rows = g.members.flatMap((u) => {
      const rs = results.filter((r) => r.user_id === u && r.drill_id === drill && r.drill_hcp != null);
      if (!rs.length) return [];
      const a = best(rs), b = best(rs.filter((r) => +new Date(r.created_at) >= now() - 30 * DAY));
      return [{ user_id: u, display_name: name(u), best30_hcp: b?.drill_hcp ?? null, best30_score: b ? score(b) : null, best_hcp: a.drill_hcp, best_score: score(a), rank: null as number | null, is_me: u === DEMO_ME }];
    }).sort((x, y) => (x.best30_hcp ?? 99) - (y.best30_hcp ?? 99));
    return rows.map((r) => ({ ...r, rank: r.best30_hcp == null ? null : 1 + rows.filter((x) => x.best30_hcp != null && x.best30_hcp < r.best30_hcp!).length }));
  },
  titles: async (group: string): Promise<Title[]> => { const { results } = await allData(); return groupTitles(groupById(group), results); },
  feed: async (group: string): Promise<FeedItem[]> => {
    const g = groupById(group); const { results, sessions } = await allData();
    const since = now() - 30 * DAY; const inG = (u: string) => g.members.includes(u);
    const ev: FeedItem[] = [];
    for (const s of sessions) if (inG(s.user_id) && +new Date(s.completed_at) >= since) {
      const rs = results.filter((r) => r.session_id === s.id);
      ev.push({ at: s.completed_at, user_id: s.user_id, display_name: name(s.user_id), kind: 'session', payload: { minutes: practiceMinutes(rs), drills: new Set(rs.map((r) => r.drill_id)).size } });
    }
    for (const r of results) if (inG(r.user_id) && +new Date(r.created_at) >= since && isPb(r, results))
      ev.push({ at: r.created_at, user_id: r.user_id, display_name: name(r.user_id), kind: 'personal_best', payload: { drill_id: r.drill_id, drill_hcp: r.drill_hcp } });
    for (const t of await groupTitles(g, results)) if (+new Date(t.since) >= since)
      ev.push({ at: new Date(t.since).toISOString(), user_id: t.user_id, display_name: name(t.user_id), kind: 'title', payload: { board: t.board, title_type: t.title_type } });
    for (const u of g.members) for (const a of await achOf(u, results, sessions)) if (a.earned_at && +new Date(a.earned_at) >= since)
      ev.push({ at: a.earned_at, user_id: u, display_name: name(u), kind: 'achievement', payload: { key: a.key, tier: a.tier } });
    return ev.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  },
  standings: async (): Promise<Standing[]> => {
    const { results } = await allData();
    const out: Standing[] = [];
    for (const g of groups.filter(active)) {
      const titles = await groupTitles(g, results);
      for (const b of ['overall', 'tee', 'approach', 'short', 'putting'] as const) {
        const ranked = rankBoard(g.members.map((u) => boardRow(u, results, b, now())), b);
        const me = ranked.find((r) => r.user_id === DEMO_ME)!;
        out.push({ group_id: g.group_id, group_name: g.name, board: b, my_rank: me.rank, ranked_count: ranked.filter((r) => r.eligible).length, eligible: me.eligible,
          value: me.value, n_results: me.n_results, n_drills: me.n_drills, title: titles.find((t) => t.board === b && t.user_id === DEMO_ME)?.title_type ?? null });
      }
    }
    return out;
  },
  recentAchievements: async (): Promise<AchRow[]> => (await loadMyAchievementsDemo()).filter((a) => a.earned_at).sort((a, b) => b.earned_at!.localeCompare(a.earned_at!)).slice(0, 8),
  latestFriendSession: async (): Promise<FriendSession | null> => {
    const { results, sessions } = await allData();
    const fr = new Set(friends.filter((f) => f.status === 'accepted').map((f) => f.user_id));
    const s = sessions.filter((x) => fr.has(x.user_id)).sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0];
    if (!s) return null;
    const rs = results.filter((r) => r.session_id === s.id), hs = rs.map((r) => r.drill_hcp).filter((x): x is number => x != null);
    return { user_id: s.user_id, display_name: name(s.user_id), session_id: s.id, completed_at: s.completed_at, minutes: practiceMinutes(rs),
      drill_ids: [...new Set(rs.map((r) => r.drill_id))], n_results: rs.length, mean_hcp: hs.length ? Math.round((hs.reduce((a, b) => a + b, 0) / hs.length) * 10) / 10 : null };
  },
};

export async function loadMyAchievementsDemo(): Promise<AchRow[]> {
  const { results, sessions } = await allData();
  return achOf(DEMO_ME, results, sessions);
}

/** Same shape as FriendProfile's loader. */
export async function loadFriendDemo(id: string) {
  const { results, sessions } = await allData();
  const p = PLAYERS.find((x) => x.id === id);
  const rs = results.filter((r) => r.user_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    name: p?.name ?? STRANGERS.find(([i]) => i === id)?.[1] ?? '–', real_hcp: p && p.show_real_hcp ? p.hcp : null, visibility: p ? 'friends' : 'nobody',
    results: rs, sessions: sessions.filter((s) => s.user_id === id).sort((a, b) => b.completed_at.localeCompare(a.completed_at)).slice(0, 5).map((s) => ({ id: s.id, completed_at: s.completed_at })),
    badges: p ? (await achOf(id, results, sessions)).filter((a) => a.earned_at).map((a) => ({ key: a.key, tier: a.tier, earned_at: a.earned_at })) : [],
  };
}

/** Fills the demo database with "my" 30 sessions once. */
export async function seedDemo() {
  if ((await db.sessions.count()) > 0) return;
  const w = getWorld();
  const me = PLAYERS[0];
  await db.settings.put({ key: 'me', real_hcp: me.hcp, weekly_goal_min: 120, language: 'de', accent: '#3DFFA2', display_name: 'Demo', results_visibility: 'friends', show_real_hcp: true, hide_last_place_titles: false });
  await db.sessions.bulkPut(w.sessions.filter((s) => s.user_id === DEMO_ME).map((s) => ({ id: s.id, status: 'completed' as const, drill_ids: s.drill_ids, created_at: s.started_at, started_at: s.started_at, completed_at: s.completed_at, total_min: s.total_min, synced: 1 as const })));
  await db.results.bulkPut(w.results.filter((r) => r.user_id === DEMO_ME).map((r) => ({ id: r.id, drill_id: r.drill_id, input: r.input, session_id: r.session_id, created_at: r.created_at, synced: 1 as const })));
}
