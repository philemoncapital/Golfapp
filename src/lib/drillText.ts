import type { TFunction } from 'i18next';
import type { Band, Drill } from '../engine/types';
import { targetForHcp } from '../engine/handicap';

/** Fallback HCP for the circle when no real handicap is set (middle of the scale). */
const DEFAULT_HCP = 36;

/** Circle for radius drills: the band of the REAL handicap and its radius as text ("< 4 m" or "Grün"). */
export function circleFor(drill: Drill, realHcp: number | null, greenLabel = 'Grün'): { band: Band; label: string } {
  const band = targetForHcp(drill.scoring.bands, realHcp ?? DEFAULT_HCP);
  const tg = band.target;
  const label = tg === 'green' ? greenLabel : typeof tg === 'object' && !Array.isArray(tg) ? `< ${String(tg.radius_m).replace('.', ',')} m` : '';
  return { band, label };
}

/** The question shown above the counter in live mode – says exactly what is being counted. */
export function drillQuestion(drill: Drill, realHcp: number | null, t: TFunction): string {
  const radius = drill.scoring.type === 'radius_by_band' ? circleFor(drill, realHcp, t('live.green')).label : '';
  return t(`q.${drill.id}`, { radius, defaultValue: t('q.default') });
}
