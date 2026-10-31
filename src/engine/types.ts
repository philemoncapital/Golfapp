export type Category = 'tee' | 'approach' | 'short' | 'putting';
export const CATEGORIES: Category[] = ['tee', 'approach', 'short', 'putting'];

export type BandTarget = number | 'green' | { radius_m: number } | number[];
export interface Band { hcp_hi: number; hcp_lo: number; target: BandTarget }

export type ScoringType =
  | 'count_higher_better' | 'count_lower_better' | 'time_lower_better' | 'points_per_ball'
  | 'streak' | 'stations_reached' | 'radius_by_band' | 'series_triplet';

export interface Scoring {
  type: ScoringType;
  lower_is_better: boolean;
  perfect: number | null;
  buttons?: number[];
  balls?: number;
  pass_hits?: number;
  pass_assumed?: boolean;
  result_is_putts?: boolean;
  bands: Band[];
}

export interface Drill {
  id: string;
  source: 'booklet' | 'approach_research' | 'custom';
  area: 'range' | 'pitching' | 'bunker' | 'chipping' | 'putting';
  category: Category;
  title: string;
  seen_with: string | null;
  duration_min: number;
  difficulty: number;
  shot_type: string;
  equipment_de: string;
  text: { de: DrillText; en: DrillText | null };
  scoring: Scoring;
  needs_verification: string | null;
}
export interface DrillText { setup: string; goal: string; procedure: string; scoring_note: string }

/** A ball result for radius_by_band drills. dist_m = distance to hole in metres (0 = holed). */
export interface RadiusBall { dist_m: number | null; on_green: boolean }

export type ResultInput =
  | { kind: 'value'; value: number }                       // count, points, streak, stations, minutes
  | { kind: 'time_fallback'; hits: number; limit_min: number; required_hits: number } // Chip to a Towel not finished
  | { kind: 'radius'; balls: RadiusBall[] }
  | { kind: 'triplet'; achieved: [number, number, number] };

export interface DrillResult { drill_id: string; created_at: string; input: ResultInput }
