import { supabase } from './supabase';
import { db, getSettings } from './db';
import { isDemo } from './demo';

export type SyncState = 'offline' | 'local' | 'ok' | 'error' | 'syncing';
type Listener = (s: SyncState, pushed: number) => void;
const listeners = new Set<Listener>();
let state: SyncState = supabase ? 'syncing' : 'local';
export const syncState = () => state;
/** Called after every sync run; `pushed` = number of rows sent (lets screens refresh leaderboards / achievements). */
export function onSync(l: Listener) { listeners.add(l); return () => void listeners.delete(l); }
const emit = (s: SyncState, pushed = 0) => { state = s; listeners.forEach((l) => l(s, pushed)); };

const REJECT = new Set(['22023', '23503', '23514', '22P02']); // invalid input / unknown drill / check / bad json → never retry

/** Pushes the profile (when changed locally), then sessions, then results. Results carry client UUIDs (idempotent). */
let running: Promise<SyncState> | null = null;
export function syncNow(): Promise<SyncState> {
  running ??= run().finally(() => { running = null; });
  return running;
}

async function run(): Promise<SyncState> {
  if (!supabase || isDemo) { emit('local'); return 'local'; } // demo data is never uploaded
  if (!navigator.onLine) { emit('offline'); return 'offline'; }
  const { data: auth } = await supabase.auth.getSession();
  const user = auth.session?.user;
  if (!user) { emit('local'); return 'local'; }
  emit('syncing');
  let pushed = 0;
  try {
    await syncProfile(user.id);
    const sessions = await db.sessions.where('synced').equals(0).filter((s) => s.status !== 'planned').toArray();
    for (const s of sessions) {
      const { error } = await supabase.from('sessions').upsert({
        id: s.id, user_id: user.id, status: s.status, total_min: Math.min(600, s.total_min),
        started_at: s.started_at ?? null, completed_at: s.completed_at ?? null, created_at: s.created_at,
      });
      if (error) throw error;
      await db.sessions.update(s.id, { synced: 1 });
      pushed++;
    }
    const results = await db.results.where('synced').equals(0).toArray();
    const row = (r: (typeof results)[number]) => ({ id: r.id, user_id: user.id, drill_id: r.drill_id, input: r.input, created_at: r.created_at, session_id: r.session_id });
    if (results.length) {
      const { error } = await supabase.from('drill_results').upsert(results.map(row), { onConflict: 'id', ignoreDuplicates: true });
      if (!error) {
        await db.results.bulkUpdate(results.map((r) => ({ key: r.id, changes: { synced: 1 as const } })));
        pushed += results.length;
      } else {
        // One bad row must not block the queue: retry one by one, park rows the server rejects.
        for (const r of results) {
          const { error: e } = await supabase.from('drill_results').upsert(row(r), { onConflict: 'id', ignoreDuplicates: true });
          if (!e) { await db.results.update(r.id, { synced: 1 }); pushed++; }
          else if (e.code && REJECT.has(e.code)) { console.warn('result rejected by server', r.id, e.message); await db.results.update(r.id, { synced: 2 }); }
          else throw e;
        }
      }
    }
    emit('ok', pushed);
    return 'ok';
  } catch (e) {
    console.warn('sync failed', e);
    emit('error');
    return 'error';
  }
}

/** Local edits win while `dirty`; otherwise the server profile is copied down (e.g. after signing in on a new device). */
async function syncProfile(userId: string) {
  if (!supabase) return;
  const s = await getSettings();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
  if (s.dirty) {
    const { error } = await supabase.from('profiles').update({
      real_hcp: s.real_hcp, weekly_goal_min: s.weekly_goal_min, language: s.language, accent: s.accent, timezone,
      results_visibility: s.results_visibility, show_real_hcp: s.show_real_hcp, hide_last_place_titles: s.hide_last_place_titles,
      ...(s.display_name ? { display_name: s.display_name } : {}),
    }).eq('id', userId);
    if (error) throw error;
    if (s.real_hcp != null) await supabase.from('hcp_history').insert({ user_id: userId, real_hcp: s.real_hcp });
    await db.settings.put({ ...s, dirty: false });
    return;
  }
  const { data, error } = await supabase.rpc('my_profile');
  if (error) throw error;
  const p = data as Record<string, unknown> | null;
  if (!p) return;
  // A handicap entered in local mode (before signing up) is kept and pushed on the next run.
  const keepLocalHcp = p.real_hcp == null && s.real_hcp != null;
  await db.settings.put({
    ...s,
    real_hcp: keepLocalHcp ? s.real_hcp : p.real_hcp == null ? null : Number(p.real_hcp), weekly_goal_min: Number(p.weekly_goal_min),
    language: p.language as 'de' | 'en', accent: String(p.accent), display_name: String(p.display_name),
    results_visibility: p.results_visibility as 'nobody' | 'friends' | 'groups', show_real_hcp: Boolean(p.show_real_hcp),
    hide_last_place_titles: Boolean(p.hide_last_place_titles), dirty: keepLocalHcp,
  });
  if (p.timezone !== timezone) await supabase.from('profiles').update({ timezone }).eq('id', userId);
}

export function startAutoSync() {
  if (isDemo) { emit('local'); return; }
  window.addEventListener('online', () => void syncNow());
  supabase?.auth.onAuthStateChange((e) => { if (e === 'SIGNED_IN') void syncNow(); });
  setInterval(() => void syncNow(), 60_000);
  void syncNow();
}
