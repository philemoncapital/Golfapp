/**
 * TypeScript mirror of the server-side board, title and achievement rules (0002 / 0003), used only by the demo
 * mode. Tests in compute.test.ts reproduce the scenario of supabase/tests/social_test.sql.
 */
import seed from '../data/drills.seed.json';
import type { Category, Drill, ResultInput } from '../engine/types';
import { CATEGORIES } from '../engine/types';
import { mid, orderedBands, targetForHcp } from '../engine/handicap';
import { practiceMinutes } from '../engine/stats';
import type { AchRow } from '../engine/achievements';

const DRILLS = seed as unknown as Drill[];
const drill = (id: string) => DRILLS.find((d) => d.id === id);
const round1 = (x: number) => Math.floor(x * 10 + 0.5) / 10;
const DAY = 864e5;
const W = [1, 0.7, 0.49];
const last = <T,>(xs: T[]): T | undefined => xs[xs.length - 1];

export interface R { id: string; user_id: string; session_id: string | null; drill_id: string; input: ResultInput; created_at: string; drill_hcp: number | null }
export interface S { id: string; user_id: string; started_at: string; completed_at: string }
export interface CatStat { category: Category; hcp: number; n_results: number; n_drills: number; reached_at: string }
export type Board = Category | 'overall' | 'activity';

export function categoryStats(results: R[], since: number, until: number): CatStat[] {
  const inWin = results.filter((r) => r.drill_hcp != null && +new Date(r.created_at) >= since && +new Date(r.created_at) <= until);
  const byDrill = new Map<string, R[]>();
  for (const r of inWin) byDrill.set(r.drill_id, [...(byDrill.get(r.drill_id) ?? []), r]);
  const per = new Map<Category, { dh: number; cnt: number; last: string }[]>();
  for (const [id, rs] of byDrill) {
    const d = drill(id); if (!d) continue;
    const top = [...rs].sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)).slice(0, 3);
    const dh = round1(top.reduce((a, r, i) => a + (r.drill_hcp as number) * W[i], 0) / top.reduce((a, _r, i) => a + W[i], 0));
    per.set(d.category, [...(per.get(d.category) ?? []), { dh, cnt: rs.length, last: top[0].created_at }]);
  }
  return [...per.entries()].map(([category, xs]) => ({
    category,
    hcp: round1(xs.reduce((a, x) => a + x.dh * Math.min(x.cnt, 5), 0) / xs.reduce((a, x) => a + Math.min(x.cnt, 5), 0)),
    n_results: xs.reduce((a, x) => a + x.cnt, 0), n_drills: xs.length,
    reached_at: last(xs.map((x) => x.last).sort())!,
  }));
}

export interface Row { user_id: string; value: number | null; eligible: boolean; n_results: number; n_drills: number; reached_at: string | null }
export function boardRow(user_id: string, results: R[], board: Board, now: number): Row {
  const since = now - 30 * DAY;
  const mine = results.filter((r) => r.user_id === user_id);
  if (board === 'activity') {
    const recent = mine.filter((r) => +new Date(r.created_at) >= since && +new Date(r.created_at) <= now);
    const v = practiceMinutes(recent);
    return { user_id, value: v, eligible: v > 0, n_results: 0, n_drills: 0, reached_at: last(recent.map((r) => r.created_at).sort()) ?? null };
  }
  const stats = categoryStats(mine, since, now);
  if (board === 'overall') {
    const el = stats.filter((s) => s.n_results >= 3 && s.n_drills >= 2);
    return {
      user_id, value: el.length >= 2 ? round1(el.reduce((a, s) => a + s.hcp, 0) / el.length) : null, eligible: el.length >= 2,
      n_results: el.reduce((a, s) => a + s.n_results, 0), n_drills: el.reduce((a, s) => a + s.n_drills, 0), reached_at: last(el.map((s) => s.reached_at).sort()) ?? null,
    };
  }
  const s = stats.find((x) => x.category === board);
  return { user_id, value: s?.hcp ?? null, eligible: !!s && s.n_results >= 3 && s.n_drills >= 2, n_results: s?.n_results ?? 0, n_drills: s?.n_drills ?? 0, reached_at: s?.reached_at ?? null };
}

export interface Ranked extends Row { rank: number | null; pos: number | null }
/** Ties share a rank; among tied members the earlier achievement leads (same as ranked_board in 0002). */
export function rankBoard(rows: Row[], board: Board): Ranked[] {
  const sv = (r: Row) => (board === 'activity' ? -(r.value as number) : (r.value as number));
  const el = rows.filter((r) => r.eligible).sort((a, b) => sv(a) - sv(b) || (a.reached_at ?? '').localeCompare(b.reached_at ?? '') || a.user_id.localeCompare(b.user_id));
  return [
    ...el.map((r, i) => ({ ...r, pos: i + 1, rank: 1 + el.filter((x) => sv(x) < sv(r)).length })),
    ...rows.filter((r) => !r.eligible).map((r) => ({ ...r, rank: null, pos: null })),
  ];
}

/** Leader = first, last place = last in board order; needs ≥ 3 eligible members. */
export function titlesFor(ranked: Ranked[]): { leader?: string; last?: string } {
  const el = ranked.filter((r) => r.eligible).sort((a, b) => (a.pos as number) - (b.pos as number));
  return el.length >= 3 ? { leader: el[0].user_id, last: el[el.length - 1].user_id } : {};
}

export function isPb(r: R, all: R[]): boolean {
  if (r.drill_hcp == null) return false;
  const prev = all.filter((x) => x.user_id === r.user_id && x.drill_id === r.drill_id && x.drill_hcp != null && (x.created_at < r.created_at || (x.created_at === r.created_at && x.id < r.id)));
  return prev.length > 0 && r.drill_hcp < Math.min(...prev.map((x) => x.drill_hcp as number));
}

const MEDALS: Record<string, [number, number, number]> = {
  range_rat: [10, 50, 150], grinder: [500, 2000, 5000], regular: [10, 30, 100], goal_getter: [2, 4, 8], pb_machine: [5, 20, 50], round_logger: [5, 15, 40],
};
const TIERS = ['bronze', 'silver', 'gold'] as const;

export interface AchInput {
  results: R[]; sessions: S[]; real_hcp: number | null; weekly_goal_min: number; friends_since: string | null;
  captain_since: string | null; titles: { board: string; type: 'leader' | 'last'; since: string }[]; now: number;
}
/**
 * The same criteria as refresh_achievements (0003). earned_at is reconstructed from the history (when the
 * criterion was first met) so the demo shows realistic "recently earned" dates.
 */
export function achievements(a: AchInput): AchRow[] {
  const rs = [...a.results].sort((x, y) => x.created_at.localeCompare(y.created_at));
  const ss = [...a.sessions].sort((x, y) => x.completed_at.localeCompare(y.completed_at));
  const out: AchRow[] = [];
  /** value series over time → medal row */
  const medal = (key: string, events: { at: string; value: number }[]) => {
    const th = MEDALS[key];
    const value = last(events)?.value ?? 0;
    const tierIdx = th.filter((x) => value >= x).length - 1;
    const tier_dates: Record<string, string> = {};
    TIERS.forEach((tn, i) => { const e = events.find((x) => x.value >= th[i]); if (e) tier_dates[tn] = e.at; });
    out.push({ key, tier: tierIdx >= 0 ? TIERS[tierIdx] : null, earned_at: tierIdx >= 0 ? tier_dates[TIERS[tierIdx]] : null,
      progress: { value, next: tierIdx < 2 ? th[tierIdx + 1] : null, tier_dates } });
  };
  medal('range_rat', ss.map((s, i) => ({ at: s.completed_at, value: i + 1 })));
  medal('grinder', rs.map((r, i) => ({ at: r.created_at, value: practiceMinutes(rs.slice(0, i + 1)) })));
  const days = new Set<string>();
  medal('regular', rs.map((r) => { days.add(r.created_at.slice(0, 10)); return { at: r.created_at, value: days.size }; }));
  // goal getter: longest run of consecutive weeks reaching the goal
  const wk = (iso: string) => { const d = new Date(iso); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const weeks = new Map<number, R[]>();
  for (const r of rs) weeks.set(wk(r.created_at), [...(weeks.get(wk(r.created_at)) ?? []), r]);
  const met = [...weeks.entries()].filter(([, x]) => a.weekly_goal_min > 0 && practiceMinutes(x) >= a.weekly_goal_min).map(([w]) => w).sort((x, y) => x - y);
  let run = 0, best = 0; const ge: { at: string; value: number }[] = [];
  // earned when the goal was reached in that week: the result that pushed the week's minutes over the goal
  const reachedAt = (w: number) => { const x = weeks.get(w)!; for (let i = 1; i <= x.length; i++) if (practiceMinutes(x.slice(0, i)) >= a.weekly_goal_min) return x[i - 1].created_at; return x[x.length - 1].created_at; };
  met.forEach((w, i) => { run = i > 0 && Math.round((w - met[i - 1]) / (7 * DAY)) === 1 ? run + 1 : 1; best = Math.max(best, run); ge.push({ at: reachedAt(w), value: best }); });
  medal('goal_getter', ge);
  let pbs = 0;
  medal('pb_machine', rs.map((r) => { if (isPb(r, rs)) pbs++; return { at: r.created_at, value: pbs }; }));
  medal('round_logger', []);

  const once = (key: string, at: string | null | undefined, progress: Record<string, unknown> = {}) =>
    out.push({ key, tier: null, earned_at: at ?? null, progress });
  once('first_tee', ss[0]?.completed_at, { value: Math.min(ss.length, 1), target: 1 });
  once('review_ready', ss[4]?.completed_at, { value: Math.min(ss.length, 5), target: 5 });
  const perfect = rs.filter((r) => { const d = drill(r.drill_id); const p = d?.scoring.perfect; return d && p != null && r.input.kind === 'value' && (d.scoring.lower_is_better ? r.input.value <= p : r.input.value >= p); });
  once('flawless', last(perfect)?.created_at, { drills: [...new Set(perfect.map((r) => r.drill_id))], value: new Set(perfect.map((r) => r.drill_id)).size });
  const firstPlay = new Map<string, string>();
  for (const r of rs) if (!firstPlay.has(r.drill_id)) firstPlay.set(r.drill_id, r.created_at);
  const all = DRILLS.length;
  once('complete_set', firstPlay.size >= all ? last([...firstPlay.values()].sort()) : null, { value: firstPlay.size, target: all });
  once('collector', firstPlay.size >= all ? last([...firstPlay.values()].sort()) : null, { value: firstPlay.size, target: all });
  const allRound = rs.find((r) => new Set(rs.filter((y) => +new Date(y.created_at) > +new Date(r.created_at) - 7 * DAY && y.created_at <= r.created_at).map((y) => drill(y.drill_id)?.category)).size >= 4);
  once('all_rounder', allRound?.created_at, { value: allRound ? 4 : 0, target: 4 });
  if (a.real_hcp != null) {
    const hcp = a.real_hcp;
    const hit = (better: number) => rs.find((r) => {
      const d = drill(r.drill_id); if (!d || r.drill_hcp == null) return false;
      const ord = orderedBands(d.scoring.bands); const own = ord.indexOf(targetForHcp(d.scoring.bands, hcp));
      const b = ord[own + better]; return !!b && r.drill_hcp <= mid(b);
    });
    once('on_target', hit(0)?.created_at, { real_hcp: hcp });
    once('next_level', hit(1)?.created_at, { real_hcp: hcp });
  } else { once('on_target', null, { needs_hcp: true }); once('next_level', null, { needs_hcp: true }); }
  const nowS = categoryStats(rs, -Infinity, a.now), oldS = categoryStats(rs, -Infinity, a.now - 30 * DAY);
  const gap = Math.max(0, ...CATEGORIES.map((c) => { const n = nowS.find((x) => x.category === c), o = oldS.find((x) => x.category === c); return n && o && n.n_drills >= 2 && o.n_drills >= 2 ? o.hcp - n.hcp : 0; }));
  once('breakthrough', gap >= 2 ? new Date(a.now - 2 * DAY).toISOString() : null, { value: round1(gap), target: 2 });
  once('early_bird', ss.find((s) => new Date(s.started_at).getHours() < 8)?.started_at);
  once('team_player', a.friends_since);
  once('captain', a.captain_since, { value: a.captain_since ? 3 : 0, target: 3 });
  const lead = a.titles.filter((t) => t.type === 'leader').map((t) => (a.now - +new Date(t.since)) / DAY);
  once('dynasty', lead.some((d) => d >= 28) ? new Date(a.now - (Math.max(...lead) - 28) * DAY).toISOString() : null, { value: Math.min(4, Math.floor(Math.max(0, ...lead) / 7)), target: 4 });
  for (const b of ['tee', 'approach', 'short', 'putting', 'overall']) for (const t of ['leader', 'last'] as const) {
    const held = a.titles.filter((x) => x.board === b && x.type === t);
    const w = Math.floor(held.reduce((s, x) => s + (a.now - +new Date(x.since)) / DAY, 0) / 7);
    once(`title_${b}_${t}`, held[0]?.since, { weeks: w, holding: held.length > 0 });
  }
  return out;
}
