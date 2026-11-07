import { describe, it, expect } from 'vitest';
import { personalBests, isPersonalBest, practiceMinutes, sessionSummaries, hcpOf } from './stats';

const v = (drill_id: string, value: number, created_at: string, session_id: string | null = null, id?: string) =>
  ({ drill_id, input: { kind: 'value' as const, value }, created_at, session_id, id });

describe('personal bests', () => {
  const rs = [v('circle-putting', 6, '2026-01-01'), v('circle-putting', 10, '2026-01-02'), v('circle-putting', 10, '2026-01-03'), v('five-balls', 1, '2026-01-01')];
  it('keeps the lowest HCP per drill and the earlier of equal results', () => {
    const pb = personalBests(rs);
    expect(pb.map((p) => p.drill_id)).toEqual(['circle-putting', 'five-balls']);
    expect(pb[0]).toMatchObject({ hcp: 5.5, created_at: '2026-01-02' });
  });
  it('first result is not a PB; only strictly better results are', () => {
    expect(isPersonalBest(rs[0], rs)).toBe(false);
    expect(isPersonalBest(rs[1], rs)).toBe(true);
    expect(isPersonalBest(rs[2], rs)).toBe(false);
  });
  it('prefers the server HCP when present', () => {
    expect(hcpOf({ ...rs[0], drill_hcp: 12.3 })).toBe(12.3);
    expect(hcpOf(v('no-such-drill', 1, '2026-01-01'))).toBeNull();
  });
});

describe('practice minutes', () => {
  it('counts each drill once per session, quick entries once each, within the window', () => {
    const rs = [
      v('circle-putting', 6, '2026-01-05T10:00:00Z', 's1'), v('circle-putting', 7, '2026-01-05T10:05:00Z', 's1'),
      v('five-balls', 1, '2026-01-05T10:20:00Z', 's1'),
      v('five-balls', 2, '2026-01-06T10:00:00Z', null, 'a'), v('five-balls', 2, '2026-01-06T11:00:00Z', null, 'b'),
      v('five-balls', 2, '2025-12-01T11:00:00Z', null, 'old'),
    ];
    const total = practiceMinutes(rs, undefined, new Date('2026-01-01'));
    expect(total).toBe(practiceMinutes([rs[0]]) + practiceMinutes([rs[2]]) + 2 * practiceMinutes([rs[3]]));
  });
});

describe('session summaries', () => {
  it('lists completed sessions newest first with drills, results and mean HCP', () => {
    const sessions = [
      { id: 's1', status: 'completed', completed_at: '2026-01-05T11:00:00Z' },
      { id: 's2', status: 'completed', completed_at: '2026-01-07T11:00:00Z' },
      { id: 's3', status: 'planned' },
    ];
    const rs = [v('circle-putting', 10, '2026-01-05T10:00:00Z', 's1'), v('circle-putting', 6, '2026-01-05T10:05:00Z', 's1')];
    const out = sessionSummaries(sessions, rs);
    expect(out.map((s) => s.id)).toEqual(['s2', 's1']);
    expect(out[1]).toMatchObject({ drill_ids: ['circle-putting'], n_results: 2, mean_hcp: 23 });
    expect(out[0]).toMatchObject({ n_results: 0, mean_hcp: null, minutes: 0 });
  });
});

import { dailyMinutes, minutesByCategory } from './stats';
describe('daily minutes (4-week chart)', () => {
  it('returns one row per day, oldest first, split by category', () => {
    const now = new Date(2026, 10, 7, 18);
    const rs = [v('circle-putting', 8, new Date(2026, 10, 7, 9).toISOString(), 's'), v('sandy-par', 15, new Date(2026, 10, 7, 9, 30).toISOString(), 's'),
      v('circle-putting', 9, new Date(2026, 10, 1, 9).toISOString(), 'q')];
    const d = dailyMinutes(rs, 28, now);
    expect(d).toHaveLength(28);
    expect(d[27].date).toBe('2026-11-07');
    expect(d[27].putting).toBeGreaterThan(0);
    expect(d[27].short).toBeGreaterThan(0);
    expect(d[27].total).toBe(d[27].putting + d[27].short);
    expect(d[21].putting).toBe(d[27].putting);
    expect(d[0].total).toBe(0);
    expect(minutesByCategory(rs, new Date(2026, 9, 1)).putting).toBe(2 * d[27].putting);
  });
});
