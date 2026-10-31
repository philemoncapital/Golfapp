/**
 * Invented demo world (test data only – not golf facts). Deterministic: the same seed gives the same players,
 * sessions and results on every device. Result inputs are picked so that their training HCP follows each player's
 * skill (real HCP ± category offset, slowly improving) plus noise.
 */
import seed from '../data/drills.seed.json';
import { resultHcp } from '../engine/handicap';
import type { Category, Drill, ResultInput, RadiusBall } from '../engine/types';
import { DEMO_ME } from '../lib/demo';

const DRILLS = seed as unknown as Drill[];
export interface DemoResult { id: string; user_id: string; session_id: string; drill_id: string; input: ResultInput; created_at: string; drill_hcp: number }
export interface DemoSession { id: string; user_id: string; started_at: string; completed_at: string; drill_ids: string[]; total_min: number }
export interface DemoPlayer { id: string; name: string; hcp: number; show_real_hcp: boolean; sessions: number }

export const PLAYERS: DemoPlayer[] = [
  { id: DEMO_ME, name: 'Du', hcp: 18.4, show_real_hcp: true, sessions: 30 },
  ...([['Jonas', 4.2, 28], ['Lena', 9.8, 26], ['Tim', 12.5, 22], ['Sophie', 15.1, 30], ['Max', 17.0, 24],
    ['Clara', 21.4, 27], ['Felix', 24.3, 20], ['Hannah', 28.0, 25], ['Paul', 32.5, 21], ['Mia', 36.0, 23]] as const)
    .map(([name, hcp, sessions], i) => ({ id: `d0000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, '0')}`, name, hcp, show_real_hcp: name !== 'Felix', sessions })),
];

function mulberry(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const uid = (r: () => number) => 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(r() * 16).toString(16));

const BUCKETS = [0, 1.4, 1.9, 2.9, 3.9, 4.9, 5.9, 6.9, 8];
/** All reasonable inputs per drill with their HCP, so a target HCP can be matched by a real input. */
const candCache = new Map<string, { input: ResultInput; hcp: number }[]>();
function candidates(d: Drill): { input: ResultInput; hcp: number }[] {
  const hit = candCache.get(d.id); if (hit) return hit;
  const out: { input: ResultInput; hcp: number }[] = [];
  const add = (input: ResultInput) => { try { out.push({ input, hcp: resultHcp(d, input) }); } catch { /* skip */ } };
  const s = d.scoring;
  if (s.type === 'radius_by_band') {
    const r = mulberry(d.id.length * 7919);
    const n = s.balls ?? 20;
    for (let scale = 0.4; scale <= 14; scale += 0.35) for (let k = 0; k < 4; k++) {
      add({ kind: 'radius', balls: Array.from({ length: n }, (): RadiusBall => {
        const dist = -scale * Math.log(r() || 1e-9);
        if (dist > 9 && r() > 0.3) return { dist_m: null, on_green: false };
        const b = BUCKETS.find((x) => dist <= x) ?? 8;
        return { dist_m: b, on_green: true };
      }) });
    }
  } else if (s.type === 'series_triplet') {
    for (let a = 0; a <= 12; a++) for (let b = 0; b <= 6; b++) for (let c = 0; c <= 3; c++) add({ kind: 'triplet', achieved: [a, b, c] });
  } else if (s.type === 'time_lower_better') {
    for (let m = 4; m <= 25; m += 0.5) add({ kind: 'value', value: m });
  } else {
    const ts = s.bands.map((b) => b.target as number);
    let lo = Math.max(0, Math.min(...ts) - 6), hi = Math.max(...ts) + 6;
    if (s.perfect != null) { if (s.lower_is_better) lo = Math.max(lo, s.perfect); else hi = Math.min(hi, s.perfect); }
    for (let v = lo; v <= hi; v++) add({ kind: 'value', value: v });
  }
  candCache.set(d.id, out);
  return out;
}
function inputFor(d: Drill, target: number, r: () => number): ResultInput {
  const c = [...candidates(d)].sort((a, b) => Math.abs(a.hcp - target) - Math.abs(b.hcp - target));
  return c[Math.floor(r() * Math.min(3, c.length))].input;
}

const CAT_W: [Category, number][] = [['tee', 0.27], ['approach', 0.13], ['short', 0.3], ['putting', 0.3]];
function pickDrills(r: () => number, n: number): Drill[] {
  const chosen: Drill[] = [];
  while (chosen.length < n) {
    let x = r(), cat: Category = 'putting';
    for (const [c, w] of CAT_W) { if (x < w) { cat = c; break; } x -= w; }
    const pool = DRILLS.filter((d) => d.category === cat && !chosen.includes(d));
    if (pool.length) chosen.push(pool[Math.floor(r() * pool.length)]);
  }
  return chosen;
}

export interface World { sessions: DemoSession[]; results: DemoResult[] }
let world: World | null = null;
/** Generated once per page load; dates are relative to "now" so the 30-day windows always contain data. */
export function getWorld(now = Date.now()): World {
  if (world) return world;
  const sessions: DemoSession[] = [], results: DemoResult[] = [];
  PLAYERS.forEach((p, pi) => {
    const r = mulberry(1000 + pi * 97);
    const off: Record<Category, number> = { tee: 0, approach: 0, short: 0, putting: 0 };
    for (const c of Object.keys(off) as Category[]) off[c] = -4 + r() * 9;
    for (let i = 0; i < p.sessions; i++) {
      const daysAgo = Math.max(0, 100 * Math.pow((p.sessions - i) / p.sessions, 1.6) - 1 + r() * 0.8);
      const day = new Date(now - daysAgo * 864e5);
      const early = pi === 0 && i % 9 === 3;
      day.setHours(early ? 7 : 9 + Math.floor(r() * 10), Math.floor(r() * 60), 0, 0);
      if (day.getTime() > now - 3600e3) day.setTime(now - 3 * 3600e3);
      const drills = pickDrills(r, 3 + (r() < 0.5 ? 1 : 0));
      const sid = uid(r);
      let t = day.getTime();
      for (const d of drills) {
        t += d.duration_min * 60e3;
        const skill = p.hcp + off[d.category] + 4 * (daysAgo / 100) - 1;
        const target = Math.min(54, Math.max(-4, skill + normal(r) * 3.5));
        const input = inputFor(d, target, r);
        results.push({ id: uid(r), user_id: p.id, session_id: sid, drill_id: d.id, input, created_at: new Date(t).toISOString(), drill_hcp: resultHcp(d, input) });
      }
      sessions.push({ id: sid, user_id: p.id, started_at: day.toISOString(), completed_at: new Date(t + 5 * 60e3).toISOString(), drill_ids: drills.map((d) => d.id), total_min: drills.reduce((a, d) => a + d.duration_min, 0) });
    }
  });
  world = { sessions, results };
  return world;
}
