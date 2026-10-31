import { describe, it, expect } from 'vitest';
import seed from '../data/drills.seed.json';
import type { Drill } from './types';
import { buildSession, sessionMinutes } from './session';

const drills = seed as unknown as Drill[];

describe('session builder', () => {
  it('sums durations (3 × 20 min = 60 min)', () => {
    expect(sessionMinutes([{ duration_min: 20 }, { duration_min: 20 }, { duration_min: 20 }])).toBe(60);
  });
  it('never exceeds the available time and follows the split', () => {
    const s = buildSession({ available_min: 60, split: { tee: 0, approach: 0, short: 0.5, putting: 0.5 }, drills, results: [] });
    expect(sessionMinutes(s)).toBeLessThanOrEqual(60);
    expect(sessionMinutes(s)).toBeGreaterThanOrEqual(50);
    expect(s.every((d) => d.category === 'short' || d.category === 'putting')).toBe(true);
  });
  it('avoids drills from the last session when alternatives exist', () => {
    const putting = drills.filter((d) => d.category === 'putting').map((d) => d.id);
    const s = buildSession({ available_min: 20, split: { tee: 0, approach: 0, short: 0, putting: 1 }, drills, results: [], last_session_ids: putting.slice(0, 3) });
    expect(s.some((d) => putting.slice(0, 3).includes(d.id))).toBe(false);
  });
});
