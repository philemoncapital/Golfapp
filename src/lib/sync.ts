import { supabase } from './supabase';
import { db } from './db';

/** Pushes unsynced sessions and results. Results carry client UUIDs, so retries are idempotent (upsert). */
export async function syncNow(): Promise<'offline' | 'local' | 'ok' | 'error'> {
  if (!supabase) return 'local';
  if (!navigator.onLine) return 'offline';
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 'local';
  try {
    const sessions = await db.sessions.where('synced').equals(0).toArray();
    for (const s of sessions) {
      const { error } = await supabase.from('sessions').upsert({
        id: s.id, user_id: auth.user.id, status: s.status, total_min: s.total_min,
        started_at: s.started_at ?? null, completed_at: s.completed_at ?? null, created_at: s.created_at,
      });
      if (error) throw error;
      await db.sessions.update(s.id, { synced: 1 });
    }
    const results = await db.results.where('synced').equals(0).toArray();
    if (results.length) {
      const { error } = await supabase.from('drill_results').upsert(
        results.map((r) => ({ id: r.id, user_id: auth.user!.id, drill_id: r.drill_id, input: r.input, created_at: r.created_at })),
        { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
      await db.results.bulkUpdate(results.map((r) => ({ key: r.id, changes: { synced: 1 as const } })));
    }
    return 'ok';
  } catch (e) {
    console.warn('sync failed', e);
    return 'error';
  }
}

export function startAutoSync() {
  window.addEventListener('online', () => void syncNow());
  setInterval(() => void syncNow(), 60_000);
  void syncNow();
}
