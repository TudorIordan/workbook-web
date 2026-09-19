/**
 * Workbook — data model.
 *
 * Canonical units (IMPORTANT): stored values are ALWAYS canonical, never
 * display units — weight in kg, dist in metres, secs in seconds, cal in
 * kcal. Conversion to/from kg/lb and km/mi happens only in metrics.ts.
 */

// ── Identifiers ─────────────────────────────────────────────────────────────

export type ExerciseId = string;
export type RoutineId = string;
export type SessionId = string;

// ── Measurement types ───────────────────────────────────────────────────────

export type MeasurementType =
  | 'weight_reps'
  | 'distance_time'
  | 'reps_distance'
  | 'calories_time'
  | 'time';

export type FieldKey = 'weight' | 'reps' | 'distkm' | 'distm' | 'secs' | 'cal';

export interface MeasurementSpec {
  label: string;
  hint: string;
  fields: readonly FieldKey[];
  separator: '×' | '·';
}

export const MEASUREMENTS: Record<MeasurementType, MeasurementSpec> = {
  weight_reps: {
    label: 'Weight & reps',
    hint: 'Barbell, dumbbell, machine work',
    fields: ['weight', 'reps'],
    separator: '×',
  },
  distance_time: {
    label: 'Distance & time',
    hint: 'Runs, rows, rides',
    fields: ['distkm', 'secs'],
    separator: '·',
  },
  reps_distance: {
    label: 'Reps & distance',
    hint: 'Sled pushes, carries',
    fields: ['reps', 'distm'],
    separator: '×',
  },
  calories_time: {
    label: 'Calories & time',
    hint: 'Erg and bike intervals',
    fields: ['cal', 'secs'],
    separator: '·',
  },
  time: {
    label: 'Time only',
    hint: 'Planks, holds, stretches',
    fields: ['secs'],
    separator: '·',
  },
};

export const MEASUREMENT_ORDER: readonly MeasurementType[] = [
  'weight_reps', 'distance_time', 'reps_distance', 'calories_time', 'time',
];

/** Which of MEASUREMENTS[m].fields actually carries the PR badge — the field the record is scored on. */
export const PR_FIELD_INDEX: Record<MeasurementType, number> = {
  weight_reps: 1,   // reps, at a given weight
  distance_time: 0, // distance
  reps_distance: 0, // reps
  calories_time: 0, // calories
  time: 0,
};

// ── Exercises ───────────────────────────────────────────────────────────────

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export type Equipment =
  | 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell'
  | 'Band' | 'Other';

export interface Exercise {
  id: ExerciseId;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  measurement: MeasurementType;
  custom: boolean;
  archivedAt?: number;
}

// ── Sets ────────────────────────────────────────────────────────────────────

export type SetType = 'work' | 'warmup';

export interface SetRecord {
  type: SetType;
  weight?: number;
  reps?: number;
  dist?: number;
  secs?: number;
  cal?: number;
}

export interface LiveSet extends SetRecord {
  id: string;
  done: boolean;
  completedAt?: number;
}

// ── Entries ─────────────────────────────────────────────────────────────────

export interface SessionEntry {
  exerciseId: ExerciseId;
  sets: SetRecord[];
  note?: string;
}

export interface LiveEntry {
  id: string;
  exerciseId: ExerciseId;
  sets: LiveSet[];
  note?: string;
}

// ── Sessions ────────────────────────────────────────────────────────────────

export interface Session {
  id: SessionId;
  name: string;
  routineId?: RoutineId;
  performedAt: number;
  durationMin: number;
  entries: SessionEntry[];
  /** Denormalized for the Dexie multi-entry index — derived on write. */
  exerciseIds: ExerciseId[];
  prs?: PersonalRecord[];
  updatedAt: number;
}

export interface LiveSession {
  id: SessionId;
  name: string;
  routineId?: RoutineId;
  startedAt: number;
  entries: LiveEntry[];
  rest?: { endsAt: number; totalSec: number };
}

// ── Routines ────────────────────────────────────────────────────────────────

export interface Routine {
  id: RoutineId;
  name: string;
  exerciseIds: ExerciseId[];
  createdAt: number;
  updatedAt: number;
}

// ── Settings ────────────────────────────────────────────────────────────────

export type WeightUnit = 'kg' | 'lb';
export type ThemePref = 'light' | 'dark' | 'auto';
export type LogStyle = 'rows' | 'focus';
export type RestScope = 'weights' | 'all';

export interface Settings {
  id: 'settings';
  unit: WeightUnit;
  theme: ThemePref;
  logStyle: LogStyle;
  restEnabled: boolean;
  restDefaultSec: number;
  restScope: RestScope;
  restWarmup: boolean;
  weightStepKg: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  unit: 'kg',
  theme: 'auto',
  logStyle: 'rows',
  restEnabled: true,
  restDefaultSec: 90,
  restScope: 'weights',
  restWarmup: false,
  weightStepKg: 2.5,
};

// ── Derived / view types ────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: ExerciseId;
  set: SetRecord;
  score: number;
  achievedAt: number;
}

export interface ChartPoint {
  performedAt: number;
  value: number;
  label: string;
}

export interface ExerciseStats {
  exerciseId: ExerciseId;
  best: PersonalRecord | null;
  secondary: { label: string; value: string; note: string };
  chart: ChartPoint[];
  trend: number;
  sessionCount: number;
  totalSets: number;
}

export interface StreakStats {
  currentWeeks: number;
  longestWeeks: number;
  thisWeekSessions: number;
  lastSessionAt: number | null;
}

// ── Seed data ───────────────────────────────────────────────────────────────

export const BUILTIN_EXERCISES: readonly Omit<Exercise, 'custom'>[] = [
  { id: 'bench',    name: 'Bench Press',       muscle: 'Chest',     equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'incdb',    name: 'Incline DB Press',  muscle: 'Chest',     equipment: 'Dumbbell',   measurement: 'weight_reps' },
  { id: 'fly',      name: 'Cable Fly',         muscle: 'Chest',     equipment: 'Cable',      measurement: 'weight_reps' },
  { id: 'ohp',      name: 'Overhead Press',    muscle: 'Shoulders', equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'lateral',  name: 'Lateral Raise',     muscle: 'Shoulders', equipment: 'Dumbbell',   measurement: 'weight_reps' },
  { id: 'tri',      name: 'Cable Pushdown',    muscle: 'Arms',      equipment: 'Cable',      measurement: 'weight_reps' },
  { id: 'dead',     name: 'Deadlift',          muscle: 'Back',      equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'row',      name: 'Barbell Row',       muscle: 'Back',      equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'latpd',    name: 'Lat Pulldown',      muscle: 'Back',      equipment: 'Cable',      measurement: 'weight_reps' },
  { id: 'pullup',   name: 'Pull-up',           muscle: 'Back',      equipment: 'Bodyweight', measurement: 'weight_reps' },
  { id: 'curl',     name: 'DB Curl',           muscle: 'Arms',      equipment: 'Dumbbell',   measurement: 'weight_reps' },
  { id: 'squat',    name: 'Back Squat',        muscle: 'Legs',      equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'rdl',      name: 'Romanian Deadlift', muscle: 'Legs',      equipment: 'Barbell',    measurement: 'weight_reps' },
  { id: 'legpress', name: 'Leg Press',         muscle: 'Legs',      equipment: 'Machine',    measurement: 'weight_reps' },
  { id: 'calf',     name: 'Calf Raise',        muscle: 'Legs',      equipment: 'Machine',    measurement: 'weight_reps' },
  { id: 'plank',    name: 'Plank',             muscle: 'Core',      equipment: 'Bodyweight', measurement: 'time' },
  { id: 'run',      name: 'Treadmill Run',     muscle: 'Legs',      equipment: 'Machine',    measurement: 'distance_time' },
  { id: 'rowerg',   name: 'Rowing Machine',    muscle: 'Back',      equipment: 'Machine',    measurement: 'distance_time' },
  { id: 'bike',     name: 'Assault Bike',      muscle: 'Legs',      equipment: 'Machine',    measurement: 'calories_time' },
  { id: 'sled',     name: 'Sled Push',         muscle: 'Legs',      equipment: 'Machine',    measurement: 'reps_distance' },
];

export const BUILTIN_ROUTINES: readonly Omit<Routine, 'createdAt' | 'updatedAt'>[] = [
  { id: 'push', name: 'Push A',  exerciseIds: ['bench', 'ohp', 'incdb', 'lateral', 'tri', 'plank'] },
  { id: 'pull', name: 'Pull A',  exerciseIds: ['dead', 'row', 'latpd', 'curl', 'rowerg'] },
  { id: 'legs', name: 'Leg Day', exerciseIds: ['squat', 'rdl', 'legpress', 'calf', 'bike'] },
];

export function blankSet(m: MeasurementType): SetRecord {
  switch (m) {
    case 'weight_reps':   return { type: 'work', weight: 20, reps: 10 };
    case 'distance_time': return { type: 'work', dist: 1000, secs: 300 };
    case 'reps_distance': return { type: 'work', reps: 4, dist: 20 };
    case 'calories_time': return { type: 'work', cal: 50, secs: 240 };
    case 'time':          return { type: 'work', secs: 60 };
  }
}

export const DEFAULT_SET_COUNT = { weight_reps: 3, other: 1 } as const;
