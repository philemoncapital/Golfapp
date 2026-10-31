import { describe, it, expect } from 'vitest';
import seed from '../data/drills.seed.json';
import { resultHcp } from '../engine/handicap';
import type { Drill } from '../engine/types';
import { boardRow, rankBoard, titlesFor, achievements, type R } from './compute';
import { getWorld, PLAYERS } from './world';

const drills = seed as unknown as Drill[];
const now = Date.UTC(2026, 9, 31, 12);
const mk = (user: string, drill: string, value: number, minAgo: number, session = 's-' + user): R => {
  const input = { kind: 'value' as const, value };
  return { id: `${user}-${drill}-${minAgo}`, user_id: user, session_id: session, drill_id: drill, input, created_at: new Date(now - minAgo * 60e3).toISOString(), drill_hcp: resultHcp(drills.find((d) => d.id === drill)!, input) };
};

describe('demo board rules mirror the server (scenario of social_test.sql)', () => {
  const rs: R[] = [];
  for (const [u, circle, line, five] of [['anna', 10, 9, 3], ['ben', 8, 7, 2], ['cem', 6, 5, 1]] as const) {
    rs.push(mk(u, 'circle-putting', circle - 1, 100), mk(u, 'circle-putting', circle, 90), mk(u, 'control-the-line', line, 80), mk(u, 'five-balls', five, 70));
  }
  const ranked = rankBoard(['anna', 'ben', 'cem'].map((u) => boardRow(u, rs, 'putting', now)), 'putting');
  it('ranks putting Anna, Ben, Cem and gives titles', () => {
    expect(ranked.filter((r) => r.eligible).map((r) => `${r.user_id}:${r.rank}`)).toEqual(['anna:1', 'ben:2', 'cem:3']);
    expect(titlesFor(ranked)).toEqual({ leader: 'anna', last: 'cem' });
  });
  it('overall needs 2 eligible categories; activity counts each drill once per session', () => {
    expect(boardRow('ben', rs, 'overall', now).eligible).toBe(false);
    expect(boardRow('ben', rs, 'activity', now).value).toBe(['circle-putting', 'control-the-line', 'five-balls'].reduce((a, id) => a + drills.find((d) => d.id === id)!.duration_min, 0));
  });
  it('no titles below 3 eligible members; ties share a rank, earlier first', () => {
    expect(titlesFor(ranked.slice(0, 2))).toEqual({});
    const tie = rankBoard([{ user_id: 'x', value: 10, eligible: true, n_results: 3, n_drills: 2, reached_at: '2026-10-02' }, { user_id: 'y', value: 10, eligible: true, n_results: 3, n_drills: 2, reached_at: '2026-10-01' }], 'tee');
    expect(tie.map((r) => [r.user_id, r.rank, r.pos])).toEqual([['y', 1, 1], ['x', 1, 2]]);
  });
});

describe('demo world', () => {
  const w = getWorld(now);
  it('has me with 30 sessions and 10 friends with 20–30 sessions each', () => {
    expect(PLAYERS).toHaveLength(11);
    for (const p of PLAYERS) {
      const n = w.sessions.filter((s) => s.user_id === p.id).length;
      expect(n).toBe(p.sessions);
      expect(n).toBeGreaterThanOrEqual(20);
    }
  });
  it('training HCP roughly follows the real HCP (better players rank better overall)', () => {
    const rows = PLAYERS.map((p) => boardRow(p.id, w.results, 'overall', now)).filter((r) => r.eligible);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    const best = rows.sort((a, b) => (a.value as number) - (b.value as number))[0];
    expect(PLAYERS.find((p) => p.id === best.user_id)!.hcp).toBeLessThan(13);
  });
  it('produces unlocked achievements for me', () => {
    const me = PLAYERS[0].id;
    const a = achievements({ results: w.results.filter((r) => r.user_id === me), sessions: w.sessions.filter((s) => s.user_id === me), real_hcp: 18.4, weekly_goal_min: 120, friends_since: null, captain_since: null, titles: [], now });
    const earned = a.filter((x) => x.earned_at).map((x) => x.key);
    expect(earned).toEqual(expect.arrayContaining(['range_rat', 'first_tee', 'review_ready', 'early_bird']));
    expect(a.find((x) => x.key === 'range_rat')!.tier).toBe('bronze');
  });
});
