import { supabase } from './supabase';
import { db } from './db';
import { isDemo } from './demo';

export type Board = 'overall' | 'tee' | 'approach' | 'short' | 'putting' | 'activity';
export const RANK_BOARDS: Board[] = ['overall', 'tee', 'approach', 'short', 'putting'];
export type Relation = 'none' | 'friends' | 'outgoing' | 'incoming';

export interface Friend { friendship_id: number; user_id: string; display_name: string; status: 'pending' | 'accepted' | 'declined'; direction: 'outgoing' | 'incoming'; created_at: string }
export interface SearchHit { id: string; display_name: string; relation: Relation }
export interface MyGroup { group_id: string; name: string; my_role: 'admin' | 'member'; my_status: 'invited' | 'active'; titles_enabled: boolean; member_count: number; is_owner: boolean }
export interface Member { user_id: string; display_name: string; role: 'admin' | 'member'; status: 'invited' | 'active'; is_owner: boolean; joined_at: string }
export interface BoardRow { user_id: string; display_name: string; value: number | null; eligible: boolean; rank: number | null; pos: number | null; n_results: number; n_drills: number; is_me: boolean; title: 'leader' | 'last' | null }
export interface DrillBoardRow { user_id: string; display_name: string; best30_hcp: number | null; best30_score: number | null; best_hcp: number | null; best_score: number | null; rank: number | null; is_me: boolean }
export interface Standing { group_id: string; group_name: string; board: Board; my_rank: number | null; ranked_count: number; eligible: boolean; value: number | null; n_results: number; n_drills: number; title: 'leader' | 'last' | null }
export interface FeedItem { at: string; user_id: string; display_name: string; kind: 'session' | 'personal_best' | 'title' | 'achievement'; payload: Record<string, unknown> }
export interface Title { board: Exclude<Board, 'activity'>; title_type: 'leader' | 'last'; user_id: string; since: string }
export interface FriendSession { user_id: string; display_name: string; session_id: string; completed_at: string; minutes: number; drill_ids: string[]; n_results: number; mean_hcp: number | null }

export class ApiError extends Error { constructor(message: string, public code?: string) { super(message); } }

/** Calls an RPC. Throws ApiError (message 'rate_limited', 'offline', 'signed_out' or the server message). */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new ApiError('signed_out');
  if (!navigator.onLine) throw new ApiError('offline');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new ApiError(error.message, error.code);
  return data as T;
}

/**
 * Online: fetch and store a copy. Offline or on error: return the stored copy (read-only) with its timestamp.
 * Returns null when there is neither.
 */
export async function cached<T>(key: string, load: () => Promise<T>): Promise<{ value: T; updated_at: string; stale: boolean } | null> {
  try {
    const value = await load();
    const updated_at = new Date().toISOString();
    await db.cache.put({ key, value, updated_at });
    return { value, updated_at, stale: false };
  } catch (e) {
    const row = await db.cache.get(key);
    if (row) return { value: row.value as T, updated_at: row.updated_at, stale: true };
    if (e instanceof ApiError && (e.message === 'offline' || e.message === 'signed_out')) return null;
    throw e;
  }
}

const realApi = {
  myFriends: () => rpc<Friend[]>('my_friends'),
  search: (q: string) => rpc<SearchHit[]>('search_users', { q }),
  requestFriend: (target: string) => rpc<Relation>('request_friend', { target }),
  async answerFriend(id: number, accept: boolean) {
    if (!supabase) throw new ApiError('signed_out');
    const { error } = await supabase.from('friendships').update({ status: accept ? 'accepted' : 'declined' }).eq('id', id);
    if (error) throw new ApiError(error.message, error.code);
  },
  async removeFriend(id: number) {
    if (!supabase) throw new ApiError('signed_out');
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) throw new ApiError(error.message, error.code);
  },
  myGroups: () => rpc<MyGroup[]>('my_groups'),
  createGroup: (name: string) => rpc<string>('create_group', { p_name: name }),
  invite: (group: string, user: string) => rpc<void>('invite_to_group', { p_group: group, p_user: user }),
  respondInvite: (group: string, accept: boolean) => rpc<void>('respond_group_invite', { p_group: group, p_accept: accept }),
  leaveGroup: (group: string) => rpc<void>('leave_group', { p_group: group }),
  removeMember: (group: string, user: string) => rpc<void>('remove_group_member', { p_group: group, p_user: user }),
  setRole: (group: string, user: string, role: 'admin' | 'member') => rpc<void>('set_group_role', { p_group: group, p_user: user, p_role: role }),
  setTitles: (group: string, enabled: boolean) => rpc<void>('set_group_titles', { p_group: group, p_enabled: enabled }),
  members: (group: string) => rpc<Member[]>('group_members_list', { p_group: group }),
  leaderboard: (group: string, board: Board) => rpc<BoardRow[]>('group_leaderboard', { p_group: group, p_board: board }),
  drillBoard: (group: string, drill: string) => rpc<DrillBoardRow[]>('group_drill_board', { p_group: group, p_drill: drill }),
  titles: (group: string) => rpc<Title[]>('visible_titles', { p_group: group }),
  feed: (group: string) => rpc<FeedItem[]>('group_feed', { p_group: group, p_limit: 30 }),
  standings: () => rpc<Standing[]>('my_group_standings'),
  recentAchievements: () => rpc<import('../engine/achievements').AchRow[]>('my_recent_achievements', { p_limit: 8 }),
  latestFriendSession: async () => (await rpc<FriendSession[]>('latest_friend_session'))[0] ?? null,
};

type Api = typeof realApi;
/** In demo mode every call goes to the in-memory demo backend (loaded on demand, not part of the normal bundle). */
const demoProxy = Object.fromEntries(Object.keys(realApi).map((k) => [k, async (...a: unknown[]) => {
  const { demoApi } = await import('../demo/api');
  return (demoApi as unknown as Record<string, (...x: unknown[]) => unknown>)[k](...a);
}])) as unknown as Api;
export const api: Api = isDemo ? demoProxy : realApi;
