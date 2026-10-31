import { db, uuid, type LocalSession } from './db';
import { drillById } from './drills';

export async function getPlan(): Promise<LocalSession> {
  const p = await db.sessions.where('status').equals('planned').first();
  if (p) return p;
  const s: LocalSession = { id: uuid(), status: 'planned', drill_ids: [], created_at: new Date().toISOString(), total_min: 0, synced: 0 };
  await db.sessions.add(s);
  return s;
}
const total = (ids: string[]) => ids.reduce((a, id) => a + (drillById(id)?.duration_min ?? 0), 0);
export async function setPlan(ids: string[]) {
  const p = await getPlan();
  await db.sessions.update(p.id, { drill_ids: ids, total_min: total(ids), synced: 0 });
}
export async function togglePlan(id: string) {
  const p = await getPlan();
  await setPlan(p.drill_ids.includes(id) ? p.drill_ids.filter((x) => x !== id) : [...p.drill_ids, id]);
}
export async function lastCompletedIds(): Promise<string[]> {
  const s = await db.sessions.where('status').equals('completed').reverse().sortBy('completed_at');
  return s[0]?.drill_ids ?? [];
}
