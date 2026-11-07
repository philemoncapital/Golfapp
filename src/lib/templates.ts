import { db, uuid, type LocalTemplate } from './db';
import { getPlan, setPlan } from './plan';
import { syncNow } from './sync';

export async function listTemplates(): Promise<LocalTemplate[]> {
  return (await db.templates.orderBy('updated_at').reverse().toArray()).filter((t) => !t.deleted);
}

/** Saves the current plan under a name. Updates the saved session it came from, or creates a new one. */
export async function savePlanAsTemplate(name: string, asNew = false): Promise<string> {
  const plan = await getPlan();
  const now = new Date().toISOString();
  const existing = !asNew && plan.template_id ? await db.templates.get(plan.template_id) : undefined;
  const id = existing && !existing.deleted ? existing.id : uuid();
  await db.templates.put({ id, name: name.trim().slice(0, 40), drill_ids: plan.drill_ids, deleted: false, created_at: existing?.created_at ?? now, updated_at: now, synced: 0 });
  await db.sessions.update(plan.id, { name: name.trim().slice(0, 40), template_id: id });
  void syncNow();
  return id;
}

export async function deleteTemplate(id: string) {
  await db.templates.update(id, { deleted: true, updated_at: new Date().toISOString(), synced: 0 });
  const plan = await db.sessions.where('status').equals('planned').first();
  if (plan?.template_id === id) await db.sessions.update(plan.id, { template_id: undefined });
  void syncNow();
}

/** Puts a saved session into the session builder. */
export async function loadTemplate(id: string) {
  const t = await db.templates.get(id);
  if (!t) return;
  await setPlan(t.drill_ids);
  const plan = await getPlan();
  await db.sessions.update(plan.id, { name: t.name, template_id: t.id });
}

/** Last-write-wins merge of server rows into the local table (by updated_at). */
export async function mergeServerTemplates(rows: { id: string; name: string; drill_ids: string[]; deleted: boolean; created_at: string; updated_at: string }[]) {
  for (const r of rows) {
    const local = await db.templates.get(r.id);
    if (!local || (local.synced === 1 && r.updated_at > local.updated_at)) {
      await db.templates.put({ ...r, synced: 1 });
    }
  }
}
