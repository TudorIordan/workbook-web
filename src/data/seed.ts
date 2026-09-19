import { db } from './db';
import { BUILTIN_EXERCISES, BUILTIN_ROUTINES, DEFAULT_SETTINGS } from '../domain/types';

/** First-run seeding only — detected via an empty settings table. */
export async function seedIfEmpty(): Promise<void> {
  await db.transaction('rw', db.exercises, db.routines, db.settings, async () => {
    const existing = await db.settings.get('settings');
    if (existing) return;

    await db.exercises.bulkAdd(BUILTIN_EXERCISES.map((e) => ({ ...e, custom: false })));

    const now = Date.now();
    await db.routines.bulkAdd(BUILTIN_ROUTINES.map((r) => ({ ...r, createdAt: now, updatedAt: now })));

    await db.settings.put(DEFAULT_SETTINGS);
  });
}
