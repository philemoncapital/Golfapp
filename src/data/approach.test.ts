import { describe, it, expect } from 'vitest';
import { APPROACH_DRILLS } from './approach';
import { resultHcp, mid } from '../engine/handicap';
import { ALL_DRILLS } from './allDrills';

const byId = (id: string) => APPROACH_DRILLS.find((d) => d.id === id)!;
const balls = (n: number, inside: number, dist: number, total: number) =>
  Array.from({ length: total }, (_, i) => ({ dist_m: i < n ? inside : dist, on_green: true }));

describe('approved approach drills (Phase 5)', () => {
  it('adds 4 approach drills with sources and 3 HCP bands', () => {
    expect(APPROACH_DRILLS.map((d) => d.id)).toEqual(['donald-wedge-ladder', 'random-yardage', 'pinseeker', 'ten-shot-drill']);
    for (const d of APPROACH_DRILLS) {
      expect(d.category).toBe('approach');
      expect(d.source).toBe('approach_research');
      expect(d.sources?.length).toBeGreaterThan(0);
      expect(d.scoring.bands).toHaveLength(3);
    }
    expect(ALL_DRILLS.filter((d) => d.category === 'approach')).toHaveLength(5);
    expect(new Set(ALL_DRILLS.map((d) => d.id)).size).toBe(ALL_DRILLS.length);
  });
  it('wedge ladder: 15 of 30 inside 19 m (but not 14 m) = band 26-12 midpoint', () => {
    expect(resultHcp(byId('donald-wedge-ladder'), { kind: 'radius', balls: balls(15, 16.9, 40, 30) })).toBe(19);
  });
  it('random yardage: 5 of 10 inside 18 m = band 11-0 midpoint', () => {
    expect(resultHcp(byId('random-yardage'), { kind: 'radius', balls: balls(5, 9.9, 60, 10) })).toBe(5.5);
  });
  it('pinseeker and 10-shot drill: hitting a band target gives its midpoint (10-shot: lower is better)', () => {
    for (const id of ['pinseeker', 'ten-shot-drill']) {
      const d = byId(id);
      for (const b of d.scoring.bands) expect(resultHcp(d, { kind: 'value', value: b.target as number })).toBeCloseTo(mid(b), 5);
    }
    const ten = byId('ten-shot-drill');
    expect(resultHcp(ten, { kind: 'value', value: 12 })).toBeLessThan(resultHcp(ten, { kind: 'value', value: 28 }));
  });
});
