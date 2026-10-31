import Dexie, { type Table } from 'dexie';
import type { DrillResult, ResultInput } from '../engine/types';

export interface LocalResult extends DrillResult { id: string; session_id: string | null; notes?: string; synced: 0 | 1 }
export interface LocalSession {
  id: string; status: 'planned' | 'started' | 'completed';
  drill_ids: string[]; created_at: string; started_at?: string; completed_at?: string; total_min: number; synced: 0 | 1;
}
export interface Settings { key: 'me'; real_hcp: number | null; weekly_goal_min: number; language: 'de' | 'en'; accent: string }

class PulseDB extends Dexie {
  results!: Table<LocalResult, string>;
  sessions!: Table<LocalSession, string>;
  settings!: Table<Settings, string>;
  constructor() {
    super('pulse');
    this.version(1).stores({ results: 'id, drill_id, created_at, synced', sessions: 'id, created_at, status, synced', settings: 'key' });
  }
}
export const db = new PulseDB();

export const uuid = () => crypto.randomUUID();

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('me')) ?? { key: 'me', real_hcp: null, weekly_goal_min: 180, language: 'de', accent: '#3DFFA2' };
}

export async function saveResult(drill_id: string, input: ResultInput, session_id: string | null, notes?: string) {
  const r: LocalResult = { id: uuid(), drill_id, input, session_id, notes, created_at: new Date().toISOString(), synced: 0 };
  await db.results.add(r);
  return r;
}
