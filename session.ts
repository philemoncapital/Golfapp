import type { Category, Drill, DrillResult } from './types';
import { CATEGORIES } from './types';

export const sessionMinutes = (drills: Pick<Drill, 'duration_min'>[]) => drills.reduce((a, d) => a + d.duration_min, 0);

export type Split = Record<Category, number>; // shares, summing to 1

/**
 * "I have X minutes": fill a session that follows the split.
 * - Each category gets a minute budget = split × available.
 * - Within a category, prefer drills with the fewest results in the last 30 days, then shorter drills.
 * - Drills from the previous session are used only if nothing else fits.
 * - Leftover time is filled with any drill that still fits.
 * Never exceeds the available minutes.
 */
export function buildSession(opts: {
  available_min: number; split: Split; drills: Drill[]; results: DrillResult[];
  last_session_ids?: string[]; now?: Date;
}): Drill[] {
  const now = opts.now ?? new Date();
  const since = new Date(now.getTime() - 30 * 864e5).toISOString();
  const recent = (id: string) => opts.results.filter((r) => r.drill_id === id && r.created_at >= since).length;
  const last = new Set(opts.last_session_ids ?? []);
  const rank = (a: Drill, b: Drill) =>
    Number(last.has(a.id)) - Number(last.has(b.id)) || recent(a.id) - recent(b.id) || a.duration_min - b.duration_min || a.id.localeCompare(b.id);

  const chosen: Drill[] = [];
  let remaining = opts.available_min;
  const order = [...CATEGORIES].sort((a, b) => opts.split[b] - opts.split[a]);
  for (const cat of order) {
    let budget = Math.round(opts.split[cat] * opts.available_min);
    for (const d of opts.drills.filter((x) => x.category === cat).sort(rank)) {
      if (d.duration_min <= budget && d.duration_min <= remaining) {
        chosen.push(d); budget -= d.duration_min; remaining -= d.duration_min;
      }
    }
  }
  for (const d of opts.drills.filter((x) => !chosen.includes(x)).sort(rank)) {
    if (d.duration_min <= remaining) { chosen.push(d); remaining -= d.duration_min; }
  }
  return chosen;
}
