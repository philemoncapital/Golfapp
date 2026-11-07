import { ALL_DRILLS } from '../data/allDrills';
import type { Drill, Category } from '../engine/types';

export const DRILLS: Drill[] = ALL_DRILLS;
export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
export const CAT_COLOR: Record<Category, string> = { tee: 'var(--c-tee)', approach: 'var(--c-approach)', short: 'var(--c-short)', putting: 'var(--c-putting)' };
