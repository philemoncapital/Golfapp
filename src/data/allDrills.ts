import seed from './drills.seed.json';
import { APPROACH_DRILLS } from './approach';
import type { Drill } from '../engine/types';

/** The whole seed library: 25 booklet drills + approved approach drills (Phase 5). */
export const ALL_DRILLS: Drill[] = [...(seed as unknown as Drill[]), ...APPROACH_DRILLS];
