import type { Drill, DrillResult } from './types';
import { resultHcp } from './handicap';
import seed from '../data/drills.seed.json';

const SEED = seed as unknown as Drill[];
const byId = (drills: Drill[], id: string) => drills.find((d) => d.id === id);
type R = DrillResult & { session_id?: string | null; drill_hcp?: number | null; id?: string };

/** HCP of one result: the server value when present, else the local engine. */
export function hcpOf(r: R, drills: Drill[] = SEED): number | null {
  if (r.drill_hcp != null) return Number(r.drill_hcp);
  const d = byId(drills, r.drill_id);
  try { return d ? resultHcp(d, r.input) : null; } catch { return null; }
}

export interface PersonalBest { drill_id: string; hcp: number; created_at: string }
/** Best (lowest) result HCP per drill; on equal HCP the earlier result stays the record. Sorted best first. */
export function personalBests(results: R[], drills: Drill[] = SEED): PersonalBest[] {
  const best = new Map<string, PersonalBest>();
  for (const r of [...results].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const h = hcpOf(r, drills);
    if (h == null) continue;
    const cur = best.get(r.drill_id);
    if (!cur || h < cur.hcp) best.set(r.drill_id, { drill_id: r.drill_id, hcp: h, created_at: r.created_at });
  }
  return [...best.values()].sort((a, b) => a.hcp - b.hcp);
}

/** True when `r` beats every earlier result of the same drill (the first result is not a PB). */
export function isPersonalBest(r: R, all: R[], drills: Drill[] = SEED): boolean {
  const h = hcpOf(r, drills);
  if (h == null) return false;
  const prev = all.filter((x) => x.drill_id === r.drill_id && x.created_at < r.created_at).map((x) => hcpOf(x, drills)).filter((x): x is number => x != null);
  return prev.length > 0 && h < Math.min(...prev);
}

/**
 * Practice minutes, same rule as the server (practice_minutes in 0002): every drill played counts with its
 * duration once per session; results without a session count once each.
 */
export function practiceMinutes(results: R[], drills: Drill[] = SEED, since?: Date, until?: Date): number {
  const seen = new Set<string>();
  let min = 0;
  for (const r of results) {
    const t = new Date(r.created_at);
    if ((since && t < since) || (until && t > until)) continue;
    const key = `${r.session_id ?? r.id ?? r.created_at}|${r.drill_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    min += byId(drills, r.drill_id)?.duration_min ?? 0;
  }
  return min;
}

export interface SessionSummary { id: string; completed_at: string; minutes: number; drill_ids: string[]; n_results: number; mean_hcp: number | null }
/** Completed sessions, newest first, with played minutes, drills and the mean result HCP. */
export function sessionSummaries(
  sessions: { id: string; status: string; completed_at?: string; drill_ids?: string[] }[], results: R[], drills: Drill[] = SEED, limit = 5,
): SessionSummary[] {
  return sessions
    .filter((s) => s.status === 'completed' && s.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))
    .slice(0, limit)
    .map((s) => {
      const rs = results.filter((r) => r.session_id === s.id);
      const hs = rs.map((r) => hcpOf(r, drills)).filter((x): x is number => x != null);
      return {
        id: s.id, completed_at: s.completed_at!, minutes: practiceMinutes(rs, drills),
        drill_ids: [...new Set(rs.map((r) => r.drill_id))], n_results: rs.length,
        mean_hcp: hs.length ? Math.round((hs.reduce((a, b) => a + b, 0) / hs.length) * 10) / 10 : null,
      };
    });
}
