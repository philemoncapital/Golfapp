/** Client mirror of achievement_defs (0003). Checks run on the server; the client only displays and announces. */
export type AchKind = 'medal' | 'achievement' | 'title_badge';
export interface AchDef { key: string; kind: AchKind; tiers?: { bronze: number; silver: number; gold: number } }
export interface AchRow { key: string; tier: 'bronze' | 'silver' | 'gold' | null; earned_at: string | null; progress: Record<string, unknown> | null }

export const ACH_DEFS: AchDef[] = [
  { key: 'range_rat', kind: 'medal', tiers: { bronze: 10, silver: 50, gold: 150 } },
  { key: 'grinder', kind: 'medal', tiers: { bronze: 500, silver: 2000, gold: 5000 } },
  { key: 'regular', kind: 'medal', tiers: { bronze: 10, silver: 30, gold: 100 } },
  { key: 'goal_getter', kind: 'medal', tiers: { bronze: 2, silver: 4, gold: 8 } },
  { key: 'pb_machine', kind: 'medal', tiers: { bronze: 5, silver: 20, gold: 50 } },
  { key: 'round_logger', kind: 'medal', tiers: { bronze: 5, silver: 15, gold: 40 } },
  ...['first_tee', 'flawless', 'complete_set', 'collector', 'all_rounder', 'on_target', 'next_level', 'breakthrough',
    'review_ready', 'early_bird', 'team_player', 'captain', 'dynasty'].map((key) => ({ key, kind: 'achievement' as const })),
  ...['tee', 'approach', 'short', 'putting', 'overall'].flatMap((b) => ['leader', 'last'].map((t) => ({ key: `title_${b}_${t}`, kind: 'title_badge' as const }))),
];

/** What changes when something is (re-)unlocked: tier for medals, number of drills for Flawless, else unlocked yes/no. */
export function signature(r: AchRow): string {
  if (!r.earned_at) return '';
  if (r.key === 'flawless') return `${(r.progress?.drills as unknown[] | undefined)?.length ?? 1}`;
  return r.tier ?? 'x';
}

/**
 * New unlocks since the last seen state. `seen` = key → signature. With no previous state (first load on a device)
 * nothing is announced; the caller just stores the current state.
 */
export function newUnlocks(seen: Record<string, string> | null, rows: AchRow[]): AchRow[] {
  if (!seen) return [];
  return rows.filter((r) => { const s = signature(r); return s !== '' && s !== (seen[r.key] ?? ''); });
}
export const seenState = (rows: AchRow[]) => Object.fromEntries(rows.map((r) => [r.key, signature(r)]));

/** "34 / 50" style progress: [value, target] or null when the item has no counter. */
export function progressOf(def: AchDef, r: AchRow | undefined): [number, number] | null {
  const p = r?.progress ?? {};
  const value = Number(p.value ?? 0);
  if (def.kind === 'medal') {
    const next = p.next != null ? Number(p.next) : r?.tier === 'gold' ? null : def.tiers!.bronze;
    return next == null ? null : [value, next];
  }
  if (p.target != null) return [value, Number(p.target)];
  return null;
}
