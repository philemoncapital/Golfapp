import seed from './drills.seed.json';
import { APPROACH_DRILLS } from './approach';
import { TEXT_OVERRIDES_DE } from './textOverrides';
import type { Drill } from '../engine/types';

const withClearerText = (d: Drill): Drill => {
  const o = TEXT_OVERRIDES_DE[d.id];
  return o ? { ...d, text: { ...d.text, de: { ...d.text.de, ...o } } } : d;
};

/** The whole seed library: 25 booklet drills (with clearer German texts) + approved approach drills (Phase 5). */
export const ALL_DRILLS: Drill[] = [...(seed as unknown as Drill[]), ...APPROACH_DRILLS].map(withClearerText);
