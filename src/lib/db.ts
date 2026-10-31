import Dexie, { type Table } from 'dexie';
import type { DrillResult, ResultInput } from '../engine/types';
import { isDemo } from './demo';

/** synced: 0 = queued, 1 = on the server, 2 = rejected by the server (invalid input; kept locally, never retried). */
export interface LocalResult extends DrillResult { id: string; session_id: string | null; notes?: string; synced: 0 | 1 | 2 }
export interface LocalSession {
  id: string; status: 'planned' | 'started' | 'completed';
  drill_ids: string[]; created_at: string; started_at?: string; completed_at?: string; total_min: number; synced: 0 | 1;
}
export type Visibility = 'nobody' | 'friends' | 'groups';
export interface Settings {
  key: 'me'; real_hcp: number | null; weekly_goal_min: number; language: 'de' | 'en'; accent: string;
  results_visibility?: Visibility; show_real_hcp?: boolean; hide_last_place_titles?: boolean; display_name?: string;
  /** set when local changes still need to go to the server */
  dirty?: boolean;
}
/** Read-only copies of server data (friends, groups, achievements) for offline display. */
export interface CacheRow { key: string; value: unknown; updated_at: string }

class PulseDB extends Dexie {
  results!: Table<LocalResult, string>;
  sessions!: Table<LocalSession, string>;
  settings!: Table<Settings, string>;
  cache!: Table<CacheRow, string>;
  constructor() {
    super(isDemo ? 'pulse-demo' : 'pulse'); // demo data never mixes with real data
    this.version(1).stores({ results: 'id, drill_id, created_at, synced', sessions: 'id, created_at, status, synced', settings: 'key' });
    this.version(2).stores({ results: 'id, drill_id, created_at, synced, session_id', sessions: 'id, created_at, status, synced, completed_at', settings: 'key', cache: 'key' });
  }
}
export const db = new PulseDB();

export const uuid = () => crypto.randomUUID();

export const DEFAULT_SETTINGS: Settings = {
  key: 'me', real_hcp: null, weekly_goal_min: 180, language: 'de', accent: '#3DFFA2',
  results_visibility: 'friends', show_real_hcp: true, hide_last_place_titles: false,
};
export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await db.settings.get('me')) ?? {}) };
}

export async function saveResult(drill_id: string, input: ResultInput, session_id: string | null, notes?: string) {
  const r: LocalResult = { id: uuid(), drill_id, input, session_id, notes, created_at: new Date().toISOString(), synced: 0 };
  await db.results.add(r);
  return r;
}
