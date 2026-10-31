import seed from '../data/drills.seed.json';
import type { Drill, Category } from '../engine/types';

export const DRILLS = seed as unknown as Drill[];
export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
export const CAT_COLOR: Record<Category, string> = { tee: 'var(--c-tee)', approach: 'var(--c-approach)', short: 'var(--c-short)', putting: 'var(--c-putting)' };
