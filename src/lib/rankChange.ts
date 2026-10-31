import { api, type Standing } from './api';
import { supabase } from './supabase';
import { syncNow } from './sync';
import type { Category } from '../engine/types';

export interface RankMove { group: string; from: number | null; to: number }

/** Snapshot of my ranks on one category board in every group (null when offline / signed out). */
export async function snapshot(cat: Category): Promise<Standing[] | null> {
  if (!supabase || !navigator.onLine) return null;
  try { return (await api.standings()).filter((s) => s.board === cat); } catch { return null; }
}

/** After a result: sync, then compare with the snapshot. Only changes are returned ("moved from 4th to 2nd"). */
export async function movesAfterSync(before: Standing[] | null, cat: Category): Promise<RankMove[]> {
  if (!before) return [];
  if ((await syncNow()) !== 'ok') return [];
  const after = await snapshot(cat);
  if (!after) return [];
  return after.flatMap((a) => {
    const b = before.find((x) => x.group_id === a.group_id);
    if (a.my_rank == null || b?.my_rank === a.my_rank) return [];
    return [{ group: a.group_name, from: b?.my_rank ?? null, to: a.my_rank }];
  });
}
