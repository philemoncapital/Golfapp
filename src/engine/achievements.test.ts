import { describe, it, expect } from 'vitest';
import { ACH_DEFS, newUnlocks, seenState, progressOf, type AchRow } from './achievements';

const row = (key: string, extra: Partial<AchRow> = {}): AchRow => ({ key, tier: null, earned_at: null, progress: null, ...extra });

describe('achievement definitions', () => {
  it('mirrors 0003: 6 medals, 13 achievements, 10 title badges', () => {
    expect(ACH_DEFS.filter((d) => d.kind === 'medal')).toHaveLength(6);
    expect(ACH_DEFS.filter((d) => d.kind === 'achievement')).toHaveLength(13);
    expect(ACH_DEFS.filter((d) => d.kind === 'title_badge')).toHaveLength(10);
  });
});

describe('unlock announcements', () => {
  const before = [row('first_tee'), row('range_rat', { progress: { value: 9, next: 10 } }), row('flawless', { earned_at: 'x', progress: { drills: ['a'] } })];
  it('announces nothing on the first load of a device', () => {
    expect(newUnlocks(null, before)).toEqual([]);
  });
  it('announces new unlocks, medal tier upgrades and another Flawless drill – once', () => {
    const seen = seenState(before);
    const after = [
      row('first_tee', { earned_at: '2026-10-31' }),
      row('range_rat', { tier: 'bronze', earned_at: '2026-10-31', progress: { value: 10, next: 50 } }),
      row('flawless', { earned_at: 'y', progress: { drills: ['a', 'b'] } }),
    ];
    expect(newUnlocks(seen, after).map((r) => r.key)).toEqual(['first_tee', 'range_rat', 'flawless']);
    expect(newUnlocks(seenState(after), after)).toEqual([]);
  });
});

describe('progress', () => {
  const medal = ACH_DEFS.find((d) => d.key === 'range_rat')!;
  it('medals count towards the next tier; gold has none', () => {
    expect(progressOf(medal, row('range_rat', { progress: { value: 34, next: 50 } }))).toEqual([34, 50]);
    expect(progressOf(medal, undefined)).toEqual([0, 10]);
    expect(progressOf(medal, row('range_rat', { tier: 'gold', progress: { value: 160 } }))).toBeNull();
  });
  it('one-time achievements with a target show it', () => {
    const d = ACH_DEFS.find((x) => x.key === 'complete_set')!;
    expect(progressOf(d, row('complete_set', { progress: { value: 7, target: 25 } }))).toEqual([7, 25]);
    expect(progressOf(ACH_DEFS.find((x) => x.key === 'early_bird')!, row('early_bird'))).toBeNull();
  });
});
