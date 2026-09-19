import { create } from 'zustand';
import { repo } from '../data/repo';
import { lastSets, cloneSetAsUndone } from '../domain/analytics';
import { blankSet, type Exercise, type ExerciseId, type FieldKey, type LiveEntry, type LiveSession, type LiveSet, type Session, type SetRecord, type SetType, type WeightUnit } from '../domain/types';
import { bump as bumpMetric, withUserInput } from '../domain/metrics';

function uuid(): string {
  return crypto.randomUUID();
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleWrite(s: LiveSession) {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => { void repo.putLive(s); }, 250);
}
export function flushLiveWrite(s: LiveSession | null) {
  if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
  if (s) void repo.putLive(s);
}

/** Quick workouts are named by the clock rather than a generic label. */
export function clockWorkoutName(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Night workout';
  if (h < 12) return 'Morning workout';
  if (h < 17) return 'Afternoon workout';
  if (h < 21) return 'Evening workout';
  return 'Night workout';
}

function seedEntry(exerciseId: ExerciseId, sessions: Session[]): LiveEntry {
  const prev = lastSets(sessions, exerciseId);
  const sets: LiveSet[] = prev.length
    ? prev.map((s) => ({ ...cloneSetAsUndone(s), id: uuid(), done: false }))
    : Array.from({ length: 1 }, () => ({ ...blankSet('weight_reps'), id: uuid(), done: false }));
  return { id: uuid(), exerciseId, sets };
}

interface LiveState {
  live: LiveSession | null;
  loaded: boolean;
  tick: number;

  hydrate: () => Promise<void>;
  startTick: () => () => void;

  startEmpty: () => void;
  startFromRoutine: (name: string, routineId: string | undefined, exerciseIds: ExerciseId[], exercises: Record<ExerciseId, Exercise>, sessions: Session[]) => void;
  rename: (name: string) => void;
  discard: () => void;
  finish: () => Promise<{ id: string } | null>;

  addExercises: (ids: ExerciseId[], sessions: Session[]) => void;
  removeExercise: (entryId: string) => void;

  addSet: (entryId: string) => void;
  removeSet: (entryId: string, setId: string) => void;
  toggleType: (entryId: string, setId: string) => void;
  markAllDone: (entryId: string) => void;

  toggleDone: (entryId: string, setId: string, exercise: Exercise, restEnabled: boolean, restScope: 'weights' | 'all', restWarmup: boolean, restLen: number) => void;
  bumpField: (entryId: string, setId: string, field: FieldKey, dir: 1 | -1, unit: WeightUnit) => void;
  writeField: (entryId: string, setId: string, field: FieldKey, typed: number, unit: WeightUnit) => void;
  applyPrev: (entryId: string, setId: string, prev: SetRecord) => void;

  extendRest: (sec: number) => void;
  skipRest: () => void;
}

function mutate(get: () => LiveState, set: (p: Partial<LiveState>) => void, fn: (s: LiveSession) => void) {
  const cur = get().live;
  if (!cur) return;
  const next: LiveSession = JSON.parse(JSON.stringify(cur));
  fn(next);
  set({ live: next });
  scheduleWrite(next);
}

export const useLiveStore = create<LiveState>((set, get) => ({
  live: null,
  loaded: false,
  tick: 0,

  hydrate: async () => {
    const live = await repo.getLive();
    set({ live: live ?? null, loaded: true });
  },

  startTick: () => {
    const id = setInterval(() => {
      const s = get().live;
      set({ tick: get().tick + 1 });
      if (s?.rest && s.rest.endsAt <= Date.now()) {
        mutate(get, set, (draft) => { draft.rest = undefined; });
      }
    }, 1000);
    return () => clearInterval(id);
  },

  startEmpty: () => {
    const s: LiveSession = { id: uuid(), name: clockWorkoutName(), startedAt: Date.now(), entries: [] };
    set({ live: s });
    flushLiveWrite(s);
  },

  startFromRoutine: (name, routineId, exerciseIds, _exercises, sessions) => {
    const s: LiveSession = {
      id: uuid(), name, routineId, startedAt: Date.now(),
      entries: exerciseIds.map((id) => seedEntry(id, sessions)),
    };
    set({ live: s });
    flushLiveWrite(s);
  },

  rename: (name) => mutate(get, set, (s) => { s.name = name || clockWorkoutName(); }),

  discard: () => {
    set({ live: null });
    flushLiveWrite(null);
    void repo.clearLive();
  },

  finish: async () => {
    flushLiveWrite(get().live);
    const result = await repo.finishLive();
    set({ live: null });
    return result ? { id: result.session.id } : null;
  },

  addExercises: (ids, sessions) => mutate(get, set, (s) => {
    for (const id of ids) s.entries.push(seedEntry(id, sessions));
  }),

  removeExercise: (entryId) => mutate(get, set, (s) => {
    s.entries = s.entries.filter((e) => e.id !== entryId);
  }),

  addSet: (entryId) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    if (!e) return;
    const last = e.sets[e.sets.length - 1];
    const type: SetType = 'work';
    e.sets.push(last
      ? { ...cloneSetAsUndone(last), type, id: uuid(), done: false }
      : { ...blankSet('weight_reps'), id: uuid(), done: false });
  }),

  removeSet: (entryId, setId) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    if (!e) return;
    e.sets = e.sets.filter((x) => x.id !== setId);
    if (!e.sets.length) s.entries = s.entries.filter((x) => x.id !== entryId);
  }),

  toggleType: (entryId, setId) => mutate(get, set, (s) => {
    const st = s.entries.find((x) => x.id === entryId)?.sets.find((x) => x.id === setId);
    if (st) st.type = st.type === 'warmup' ? 'work' : 'warmup';
  }),

  markAllDone: (entryId) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    e?.sets.forEach((st) => { st.done = true; });
  }),

  toggleDone: (entryId, setId, exercise, restEnabled, restScope, restWarmup, restLen) => mutate(get, set, (s) => {
    const st = s.entries.find((x) => x.id === entryId)?.sets.find((x) => x.id === setId);
    if (!st) return;
    const willDo = !st.done;
    st.done = willDo;
    st.completedAt = willDo ? Date.now() : undefined;
    if (willDo) {
      const applies = restEnabled
        && (st.type !== 'warmup' || restWarmup)
        && (restScope === 'all' || exercise.measurement === 'weight_reps');
      if (applies) s.rest = { endsAt: Date.now() + restLen * 1000, totalSec: restLen };
    }
  }),

  bumpField: (entryId, setId, field, dir, unit) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    const idx = e?.sets.findIndex((x) => x.id === setId) ?? -1;
    if (!e || idx < 0) return;
    e.sets[idx] = { ...e.sets[idx], ...bumpMetric(e.sets[idx], field, dir, unit) };
  }),

  writeField: (entryId, setId, field, typed, unit) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    const idx = e?.sets.findIndex((x) => x.id === setId) ?? -1;
    if (!e || idx < 0) return;
    e.sets[idx] = { ...e.sets[idx], ...withUserInput(e.sets[idx], field, typed, unit) };
  }),

  applyPrev: (entryId, setId, prev) => mutate(get, set, (s) => {
    const e = s.entries.find((x) => x.id === entryId);
    const st = e?.sets.find((x) => x.id === setId);
    if (!st) return;
    st.weight = prev.weight; st.reps = prev.reps; st.dist = prev.dist; st.secs = prev.secs; st.cal = prev.cal;
  }),

  extendRest: (sec) => mutate(get, set, (s) => {
    if (!s.rest) return;
    s.rest = { endsAt: s.rest.endsAt + sec * 1000, totalSec: s.rest.totalSec + sec };
  }),
  skipRest: () => mutate(get, set, (s) => { s.rest = undefined; }),
}));
