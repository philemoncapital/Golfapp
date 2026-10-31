import type { Band, Drill, DrillResult, ResultInput, RadiusBall, Category } from './types';
import { CATEGORIES } from './types';

/** HCP numbers: 54 is the worst, 0 is scratch, negative numbers are plus handicaps (+5 = -5). */
export const HCP_MIN = -5;
export const HCP_MAX = 54;
const clamp = (x: number) => Math.min(HCP_MAX, Math.max(HCP_MIN, x));
const round1 = (x: number) => Math.round(x * 10) / 10;
export const mid = (b: Band) => (b.hcp_hi + b.hcp_lo) / 2;

/** Bands ordered from worst (highest HCP) to best (lowest HCP). */
export function orderedBands(bands: Band[]): Band[] {
  return [...bands].sort((a, b) => b.hcp_hi - a.hcp_hi);
}

/**
 * Piecewise-linear interpolation between (target, band midpoint) anchors.
 * Beyond the outer anchors the nearest segment is extended linearly; the result is clamped to [+5, 54].
 */
export function interpolateHcp(value: number, bands: Band[], lowerIsBetter: boolean): number {
  const anchors = orderedBands(bands).map((b) => {
    if (typeof b.target !== 'number') throw new Error('interpolateHcp needs numeric targets');
    return { x: b.target, y: mid(b) };
  });
  // Normalise so x increases as the player gets better.
  const pts = anchors.map((a) => ({ x: lowerIsBetter ? -a.x : a.x, y: a.y }));
  const v = lowerIsBetter ? -value : value;
  for (let i = 1; i < pts.length; i++) {
    if (!(pts[i].x > pts[i - 1].x)) throw new Error('Band targets must strictly improve from worst to best band');
  }
  let i = 1;
  if (v <= pts[0].x) i = 1;
  else if (v >= pts[pts.length - 1].x) i = pts.length - 1;
  else while (i < pts.length - 1 && v > pts[i].x) i++;
  const a = pts[i - 1], b = pts[i];
  const y = a.y + ((v - a.x) / (b.x - a.x)) * (b.y - a.y);
  return round1(clamp(y));
}

function radiusHit(ball: RadiusBall, target: Band['target']): boolean {
  if (target === 'green') return ball.on_green || ball.dist_m === 0;
  if (typeof target === 'object' && !Array.isArray(target)) return ball.dist_m !== null && ball.dist_m < target.radius_m;
  throw new Error('radius band needs "green" or {radius_m}');
}

/** Generic "best band met, then interpolate by share towards the next better band" rule. */
function bandLadder(bands: Band[], metShare: (b: Band) => number, towardNext?: (cur: Band, next: Band) => number): number {
  const ord = orderedBands(bands); // worst → best
  let best = -1;
  for (let i = 0; i < ord.length; i++) if (metShare(ord[i]) >= 1) best = i;
  if (best === -1) {
    // Nothing met: between the worst band midpoint and 54, by share of the worst band.
    const s = Math.min(metShare(ord[0]), 1);
    return round1(clamp(HCP_MAX - s * (HCP_MAX - mid(ord[0]))));
  }
  const m = mid(ord[best]);
  if (best === ord.length - 1) {
    // Best band met: move from its midpoint towards its lower bound by how far beyond the pass mark.
    const extra = Math.min(Math.max(metShare(ord[best]) - 1, 0), 1);
    return round1(clamp(m - extra * (m - ord[best].hcp_lo)));
  }
  const next = ord[best + 1];
  const s = Math.min(towardNext ? towardNext(ord[best], next) : metShare(next), 0.999);
  return round1(clamp(m - s * (m - mid(next))));
}

export function radiusHcp(balls: RadiusBall[], bands: Band[], passHits: number, totalBalls: number): number {
  return bandLadder(bands, (b) => {
    const hits = balls.filter((x) => radiusHit(x, b.target)).length;
    if (hits < passHits) return hits / passHits;
    // ≥1 when met; scaled so that all balls = 2 (used only for the best band).
    return 1 + (totalBalls > passHits ? (hits - passHits) / (totalBalls - passHits) : 0);
  });
}

export function tripletHcp(achieved: [number, number, number], bands: Band[]): number {
  return bandLadder(bands, (b) => {
    const t = b.target as number[];
    const shares = t.map((ti, i) => Math.min(achieved[i] / ti, 1));
    return shares.every((s) => s >= 1) ? 1 : shares.reduce((a, c) => a + c, 0) / shares.length;
  }, (cur, next) => {
    // Progress from the met band's targets towards the next band's targets, averaged over the 3 positions.
    const c = cur.target as number[], n = next.target as number[];
    const p = n.map((ni, i) => (ni === c[i] ? 1 : Math.min(Math.max((achieved[i] - c[i]) / (ni - c[i]), 0), 1)));
    return p.reduce((a, x) => a + x, 0) / p.length;
  });
}

/** Chip to a Towel not finished in time: equivalent minutes = limit × required / hits (assumption, see ASSUMPTIONS.md). */
export function timeFallbackMinutes(hits: number, limitMin: number, required: number): number {
  return limitMin * required / Math.max(hits, 0.5);
}

export function resultHcp(drill: Drill, input: ResultInput): number {
  const s = drill.scoring;
  switch (input.kind) {
    case 'value':
      return interpolateHcp(input.value, s.bands, s.lower_is_better);
    case 'time_fallback':
      return interpolateHcp(timeFallbackMinutes(input.hits, input.limit_min, input.required_hits), s.bands, true);
    case 'radius':
      return radiusHcp(input.balls, s.bands, s.pass_hits ?? Math.ceil((s.balls ?? input.balls.length) / 2), s.balls ?? input.balls.length);
    case 'triplet':
      return tripletHcp(input.achieved, s.bands);
  }
}

/** Drill HCP = weighted mean of the last 3 results, newest weighted most (1, 0.7, 0.49). */
export const RECENCY_WEIGHTS = [1, 0.7, 0.49];
export function drillHcp(drill: Drill, results: DrillResult[]): number | null {
  const mine = results.filter((r) => r.drill_id === drill.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
  if (!mine.length) return null;
  let num = 0, den = 0;
  mine.forEach((r, i) => { num += resultHcp(drill, r.input) * RECENCY_WEIGHTS[i]; den += RECENCY_WEIGHTS[i]; });
  return round1(num / den);
}

export interface CategoryHcp { category: Category; hcp: number | null; drills_with_data: number }
/** Category HCP = mean of drill HCPs weighted by result count (cap 5); needs ≥ 2 different drills. */
export function categoryHcps(drills: Drill[], results: DrillResult[]): CategoryHcp[] {
  return CATEGORIES.map((category) => {
    let num = 0, den = 0, n = 0;
    for (const d of drills.filter((x) => x.category === category)) {
      const h = drillHcp(d, results);
      if (h === null) continue;
      const w = Math.min(results.filter((r) => r.drill_id === d.id).length, 5);
      num += h * w; den += w; n++;
    }
    return { category, hcp: n >= 2 ? round1(num / den) : null, drills_with_data: n };
  });
}

/** Overall training HCP. Default: equal weights (no cited source fixes exact weights yet — see ASSUMPTIONS.md). */
export const DEFAULT_CATEGORY_WEIGHTS: Record<Category, number> = { tee: 1, approach: 1, short: 1, putting: 1 };
export function overallHcp(cats: CategoryHcp[], weights = DEFAULT_CATEGORY_WEIGHTS): number | null {
  const avail = cats.filter((c) => c.hcp !== null);
  if (avail.length < 2) return null;
  const den = avail.reduce((a, c) => a + weights[c.category], 0);
  return round1(avail.reduce((a, c) => a + (c.hcp as number) * weights[c.category], 0) / den);
}

/** The booklet target for a given real HCP: the band containing it, else the nearest band (bands can have gaps, e.g. 26-14 / 11-0). */
export function targetForHcp(bands: Band[], hcp: number): Band {
  const h = Math.min(54, Math.max(0, hcp));
  const dist = (b: Band) => (h > b.hcp_hi ? h - b.hcp_hi : h < b.hcp_lo ? b.hcp_lo - h : 0);
  return [...bands].sort((a, b) => dist(a) - dist(b))[0];
}
