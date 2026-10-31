import { describe, it, expect } from 'vitest';
import seed from '../data/drills.seed.json';
import type { Drill, DrillResult } from './types';
import { interpolateHcp, resultHcp, drillHcp, categoryHcps, overallHcp, targetForHcp, mid, orderedBands } from './handicap';

const drills = seed as unknown as Drill[];
const byId = (id: string) => drills.find((d) => d.id === id)!;

describe('seed parsing', () => {
  it('imports all 25 booklet drills', () => expect(drills).toHaveLength(25));
  it('keeps irregular bands exactly', () => {
    expect(byId('fade-and-draw').scoring.bands[0]).toMatchObject({ hcp_hi: 36, hcp_lo: 27 });
    expect(byId('hit-three-greens').scoring.bands[1]).toMatchObject({ hcp_hi: 26, hcp_lo: 14 });
    expect(byId('chip-to-a-towel').scoring.bands.slice(0, 2).map((b) => `${b.hcp_hi}-${b.hcp_lo}`)).toEqual(['54-37', '36-27']);
  });
  it('every drill has 3, 5 or 6 bands and a category', () => {
    for (const d of drills) {
      expect([3, 5, 6]).toContain(d.scoring.bands.length);
      expect(['tee', 'approach', 'short', 'putting']).toContain(d.category);
    }
  });
});

describe('interpolation', () => {
  it('hitting a band target exactly returns the band midpoint, for every numeric drill', () => {
    for (const d of drills) {
      for (const b of d.scoring.bands) {
        if (typeof b.target !== 'number') continue;
        expect(interpolateHcp(b.target, d.scoring.bands, d.scoring.lower_is_better), `${d.id} ${b.hcp_hi}-${b.hcp_lo}`).toBeCloseTo(mid(b), 1);
      }
    }
  });
  it('is monotonic: a better result never gives a worse HCP', () => {
    for (const d of drills.filter((x) => typeof x.scoring.bands[0].target === 'number')) {
      const ts = d.scoring.bands.map((b) => b.target as number);
      const lo = Math.min(...ts) - 5, hi = Math.max(...ts) + 5;
      let prev = d.scoring.lower_is_better ? -Infinity : Infinity;
      for (let v = lo; v <= hi; v += 0.5) {
        const h = interpolateHcp(v, d.scoring.bands, d.scoring.lower_is_better);
        if (d.scoring.lower_is_better) expect(h).toBeGreaterThanOrEqual(prev - 1e-9);
        else expect(h).toBeLessThanOrEqual(prev + 1e-9);
        prev = h;
      }
    }
  });
  it('interpolates between anchors (Hit the Hall, lower is better)', () => {
    // 54-27 → 24 putts (mid 40.5), 26-12 → 18 putts (mid 19); 21 putts lies halfway.
    expect(resultHcp(byId('hit-the-hall'), { kind: 'value', value: 21 })).toBeCloseTo(29.8, 1);
  });
  it('clamps to [+5, 54]', () => {
    expect(resultHcp(byId('14-fairways'), { kind: 'value', value: 0 })).toBe(54);
    expect(resultHcp(byId('14-fairways'), { kind: 'value', value: 14 })).toBeGreaterThanOrEqual(-5);
  });
});

describe('radius_by_band (Five Different Clubs, pass = 10 of 20)', () => {
  const d = byId('five-different-clubs');
  const balls = (n: number, dist: number) => Array.from({ length: 20 }, (_, i) => ({ dist_m: i < n ? dist : 20, on_green: i < n }));
  it('10 balls inside 4 m but not 3 m → 18-12 band midpoint', () => {
    expect(resultHcp(d, { kind: 'radius', balls: balls(10, 3.5) })).toBe(15);
  });
  it('more hits inside the next radius move towards the next band', () => {
    const mixed = [...balls(10, 3.5).slice(0, 10), ...Array.from({ length: 10 }, () => ({ dist_m: 2.5, on_green: true }))];
    // 20 inside 4 m, 10 inside 3 m → 11-5 band met (mid 8)
    expect(resultHcp(d, { kind: 'radius', balls: mixed })).toBe(8);
  });
  it('nothing met → between worst midpoint and 54', () => {
    expect(resultHcp(d, { kind: 'radius', balls: balls(5, 20) })).toBeGreaterThan(40.5);
  });
});

describe('series_triplet (Shorties under Pressure)', () => {
  const d = byId('shorties-under-pressure');
  it('meeting 5/3/1 exactly → 26-12 midpoint', () => expect(resultHcp(d, { kind: 'triplet', achieved: [5, 3, 1] })).toBe(19));
  it('partial progress towards 10/4/2 improves the estimate', () => {
    expect(resultHcp(d, { kind: 'triplet', achieved: [8, 4, 1] })).toBeLessThan(19);
  });
});

describe('aggregation', () => {
  const r = (drill_id: string, value: number, day: number): DrillResult => ({ drill_id, created_at: `2026-10-${String(day).padStart(2, '0')}T10:00:00Z`, input: { kind: 'value', value } });
  it('drill HCP weights the newest result most', () => {
    const d = byId('circle-putting'); // 54-27:6, 26-12:8, 11-0:10
    const h = drillHcp(d, [r(d.id, 6, 1), r(d.id, 10, 2)]);
    expect(h).toBeLessThan((40.5 + 5.5) / 2);
  });
  it('category HCP needs ≥ 2 drills; overall needs ≥ 2 categories', () => {
    const res = [r('circle-putting', 8, 1), r('shootout', 8, 1)];
    const cats = categoryHcps(drills, res);
    expect(cats.find((c) => c.category === 'putting')!.hcp).toBe(19);
    expect(cats.find((c) => c.category === 'tee')!.hcp).toBeNull();
    expect(overallHcp(cats)).toBeNull();
  });
});

describe('targetForHcp', () => {
  it('finds the containing band, or the nearest one across gaps', () => {
    const hg = byId('hit-three-greens').scoring.bands;
    expect(targetForHcp(hg, 20).target).toBe(14);
    expect(targetForHcp(hg, 12.5).target).toBe(14);
    expect(orderedBands(hg)[0].target).toBe(9);
  });
});
