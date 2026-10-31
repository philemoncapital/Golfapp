import { supabase } from './supabase';
import { isDemo } from './demo';
import { db } from './db';
import { ApiError } from './api';
import { onSync } from './sync';
import { newUnlocks, seenState, type AchRow } from '../engine/achievements';

export async function loadMyAchievements(): Promise<AchRow[]> {
  if (isDemo) return (await import('../demo/api')).loadMyAchievementsDemo();
  if (!supabase) throw new ApiError('signed_out');
  if (!navigator.onLine) throw new ApiError('offline');
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new ApiError('signed_out');
  const { data, error } = await supabase.from('user_achievements').select('key, tier, earned_at, progress').eq('user_id', uid);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as AchRow[];
}

type Listener = (rows: AchRow[]) => void;
const listeners = new Set<Listener>();
export const onUnlock = (l: Listener) => { listeners.add(l); return () => void listeners.delete(l); };

/** After each successful sync: compare the server state with what this device has already announced. */
export async function checkUnlocks() {
  let rows: AchRow[];
  try { rows = await loadMyAchievements(); } catch { return; }
  await db.cache.put({ key: 'achievements', value: rows, updated_at: new Date().toISOString() });
  const seenRow = await db.cache.get('ach_seen');
  const fresh = newUnlocks((seenRow?.value as Record<string, string> | undefined) ?? null, rows);
  await db.cache.put({ key: 'ach_seen', value: seenState(rows), updated_at: new Date().toISOString() });
  if (fresh.length) listeners.forEach((l) => l(fresh));
}

export function startUnlockWatch() {
  onSync((s) => { if (s === 'ok') void checkUnlocks(); });
}
