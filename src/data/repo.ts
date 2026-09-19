import { db } from './db';
import { detectPRs } from '../domain/analytics';
import {
  DEFAULT_SETTINGS, type Exercise, type ExerciseId, type LiveSession,
  type PersonalRecord, type Routine, type RoutineId, type Session,
  type SessionId, type Settings,
} from '../domain/types';

const LIVE_ID = 'current';

function uuid(): string {
  return crypto.randomUUID();
}

export const repo = {
  // ── exercises ────────────────────────────────────────────────────────
  listExercises(): Promise<Exercise[]> {
    return db.exercises.toArray();
  },
  async createExercise(draft: Omit<Exercise, 'id' | 'custom'>): Promise<Exercise> {
    const ex: Exercise = { ...draft, id: uuid(), custom: true };
    await db.exercises.add(ex);
    return ex;
  },
  async archiveExercise(id: ExerciseId): Promise<void> {
    await db.exercises.update(id, { archivedAt: Date.now() });
  },

  // ── routines ─────────────────────────────────────────────────────────
  listRoutines(): Promise<Routine[]> {
    return db.routines.toArray();
  },
  async saveRoutine(r: Routine): Promise<void> {
    await db.routines.put({ ...r, updatedAt: Date.now() });
  },
  async deleteRoutine(id: RoutineId): Promise<void> {
    await db.routines.delete(id);
  },

  // ── history ──────────────────────────────────────────────────────────
  async listSessions(limit?: number): Promise<Session[]> {
    const all = await db.sessions.orderBy('performedAt').reverse().toArray();
    return limit ? all.slice(0, limit) : all;
  },
  sessionsForExercise(id: ExerciseId): Promise<Session[]> {
    return db.sessions.where('exerciseIds').equals(id).reverse().sortBy('performedAt');
  },
  getSession(id: SessionId): Promise<Session | undefined> {
    return db.sessions.get(id);
  },
  async updateSession(id: SessionId, mutate: (s: Session) => void): Promise<void> {
    await db.transaction('rw', db.sessions, async () => {
      const s = await db.sessions.get(id);
      if (!s) return;
      mutate(s);
      s.entries = s.entries.filter((e) => e.sets.length > 0);
      if (!s.entries.length) {
        await db.sessions.delete(id);
        return;
      }
      s.exerciseIds = s.entries.map((e) => e.exerciseId);
      s.updatedAt = Date.now();
      await db.sessions.put(s);
    });
  },
  async deleteSession(id: SessionId): Promise<void> {
    await db.sessions.delete(id);
  },

  // ── live session ─────────────────────────────────────────────────────
  getLive(): Promise<LiveSession | undefined> {
    return db.live.get(LIVE_ID);
  },
  async putLive(s: LiveSession): Promise<void> {
    await db.live.put({ ...s, id: LIVE_ID });
  },
  async clearLive(): Promise<void> {
    await db.live.delete(LIVE_ID);
  },
  async finishLive(): Promise<{ session: Session; prs: PersonalRecord[] } | null> {
    return db.transaction('rw', db.live, db.sessions, db.exercises, async () => {
      const live = await db.live.get(LIVE_ID);
      if (!live) return null;

      const entries = live.entries
        .map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets.filter((s) => s.done).map((s) => ({
            type: s.type, reps: s.reps, weight: s.weight, dist: s.dist, secs: s.secs, cal: s.cal,
          })),
        }))
        .filter((e) => e.sets.length > 0);

      if (!entries.length) {
        await db.live.delete(LIVE_ID);
        return null;
      }

      const exList = await db.exercises.toArray();
      const exMap: Record<ExerciseId, Exercise> = {};
      exList.forEach((e) => { exMap[e.id] = e; });

      const priorSessions = await db.sessions.toArray();
      const prs = detectPRs(entries, exMap, priorSessions);

      const mins = Math.max(1, Math.round((Date.now() - live.startedAt) / 60000));
      const session: Session = {
        id: uuid(),
        name: live.name,
        routineId: live.routineId,
        performedAt: Date.now(),
        durationMin: mins,
        entries,
        exerciseIds: entries.map((e) => e.exerciseId),
        prs,
        updatedAt: Date.now(),
      };

      await db.sessions.put(session);
      await db.live.delete(LIVE_ID);
      return { session, prs };
    });
  },

  // ── settings ─────────────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    const s = await db.settings.get('settings');
    return s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS;
  },
  async patchSettings(p: Partial<Settings>): Promise<Settings> {
    const cur = await repo.getSettings();
    const next = { ...cur, ...p };
    await db.settings.put(next);
    return next;
  },

  // ── maintenance ──────────────────────────────────────────────────────
  async exportAll(): Promise<Blob> {
    const [exercises, routines, sessions, settings] = await Promise.all([
      db.exercises.toArray(), db.routines.toArray(), db.sessions.toArray(), repo.getSettings(),
    ]);
    const payload = { version: 1, exportedAt: Date.now(), exercises, routines, sessions, settings };
    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  },
  async importAll(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || data.version !== 1) throw new Error('Unsupported export version');
    await db.transaction('rw', db.exercises, db.routines, db.sessions, db.settings, async () => {
      for (const ex of data.exercises ?? []) await db.exercises.put(ex);
      for (const r of data.routines ?? []) await db.routines.put(r);
      for (const s of data.sessions ?? []) await db.sessions.put(s);
      if (data.settings) await db.settings.put(data.settings);
    });
  },
  async wipe(): Promise<void> {
    await db.transaction('rw', db.exercises, db.routines, db.sessions, db.live, db.settings, async () => {
      await Promise.all([
        db.exercises.clear(), db.routines.clear(), db.sessions.clear(),
        db.live.clear(), db.settings.clear(),
      ]);
    });
  },
};
