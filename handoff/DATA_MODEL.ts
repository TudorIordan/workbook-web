/**
 * Workbook — data model
 *
 * Drop this in as `src/domain/types.ts`. Everything else in the app should
 * import from here rather than re-declaring shapes.
 *
 * ── Canonical units (IMPORTANT) ─────────────────────────────────────────────
 * Stored values are ALWAYS canonical, never display units:
 *   weight  → kilograms (number, may be fractional)
 *   dist    → metres    (number)
 *   secs    → seconds   (integer)
 *   cal     → kilocalories (integer)
 * Conversion to/from kg/lb and km/mi happens only at the formatting and input
 * boundaries (`metrics.ts`). This is the single most important invariant in the
 * app: the prototype got it right and it must not regress, or every historical
 * record becomes ambiguous.
 */

// ── Identifiers ─────────────────────────────────────────────────────────────

export type ExerciseId = string;
export type RoutineId = string;
export type SessionId = string;

// ── Measurement types ───────────────────────────────────────────────────────

/** Which pair of fields an exercise is logged with. */
export type MeasurementType =
  | 'weight_reps'    // barbell, dumbbell, machine work
  | 'distance_time'  // runs, rows, rides
  | 'reps_distance'  // sled pushes, carries
  | 'calories_time'  // erg and bike intervals
  | 'time';          // planks, holds, stretches

/** A single loggable input. `distkm`/`distm` both write `SetRecord.dist`
 *  (metres) — they differ only in the scale they're displayed and stepped at. */
export type FieldKey = 'weight' | 'reps' | 'distkm' | 'distm' | 'secs' | 'cal';

export interface MeasurementSpec {
  label: string;
  hint: string;
  /** Ordered fields shown in the UI. Length 1 or 2. */
  fields: readonly FieldKey[];
  /** Separator between the two values in summary strings. */
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

/** Display order in the create-exercise picker. */
export const MEASUREMENT_ORDER: readonly MeasurementType[] = [
  'weight_reps', 'distance_time', 'reps_distance', 'calories_time', 'time',
];

// ── Exercises ───────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export type Equipment =
  | 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell'
  | 'Band' | 'Other';

export interface Exercise {
  id: ExerciseId;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  measurement: MeasurementType;
  /** true for user-created exercises; built-ins are seeded and not deletable. */
  custom: boolean;
  /** Soft-delete so historical sessions keep resolving their exercise. */
  archivedAt?: number;
}

// ── Sets ────────────────────────────────────────────────────────────────────

export type SetType = 'work' | 'warmup';

/**
 * One set. Only the fields relevant to the exercise's measurement type are
 * populated; the rest are undefined. All values canonical (see header).
 */
export interface SetRecord {
  type: SetType;
  weight?: number; // kg
  reps?: number;   // integer
  dist?: number;   // metres
  secs?: number;   // seconds
  cal?: number;    // kcal
}

/** A set while a session is in progress — adds completion state. */
export interface LiveSet extends SetRecord {
  /** Locally unique, stable across reorders — needed for list keys and gestures. */
  id: string;
  done: boolean;
  /** When the user checked it off; drives rest-timer and honesty of timestamps. */
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

/** A completed workout. Immutable-ish: editing rewrites it in place. */
export interface Session {
  id: SessionId;
  name: string;
  routineId?: RoutineId;
  /** Epoch ms of when the workout happened (prototype used a Date). */
  performedAt: number;
  /** Whole minutes, >= 1. */
  durationMin: number;
  entries: SessionEntry[];
  updatedAt: number;
}

/** The single in-progress workout. Persisted so a reload resumes it. */
export interface LiveSession {
  id: SessionId;
  name: string;
  routineId?: RoutineId;
  /** Epoch ms. Elapsed time is ALWAYS Date.now() - startedAt, never a counter. */
  startedAt: number;
  entries: LiveEntry[];
  /** Persisted so the rest timer survives a reload. */
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

export interface Settings {
  /** Singleton row. */
  id: 'settings';
  unit: WeightUnit;
  theme: ThemePref;
  logStyle: LogStyle;
  restDefaultSec: number; // prototype: 90
  /** Weight increment in kg (2.5kg plates by default; lb mode steps 2.5lb). */
  weightStepKg: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  unit: 'kg',
  theme: 'auto',
  logStyle: 'rows',
  restDefaultSec: 90,
  weightStepKg: 2.5,
};

// ── Derived / view types ────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: ExerciseId;
  /** The scored set that set the record. */
  set: SetRecord;
  score: number;
  achievedAt: number;
}

export interface ChartPoint {
  performedAt: number;
  /** Chart value for the session's top set (see ANALYTICS.md). */
  value: number;
  /** Preformatted for the bar label, e.g. "82.5" or "7:30". */
  label: string;
}

export interface ExerciseStats {
  exerciseId: ExerciseId;
  best: PersonalRecord | null;
  /** Measurement-dependent second tile: est. 1RM, best pace, etc. */
  secondary: { label: string; value: string; note: string };
  /** Last 8 sessions, oldest → newest. */
  chart: ChartPoint[];
  /** Signed delta between first and last chart point. */
  trend: number;
  sessionCount: number;
  totalSets: number;
}

export interface StreakStats {
  /** Consecutive ISO weeks with >= 1 session, counting back from this week. */
  currentWeeks: number;
  longestWeeks: number;
  /** Sessions in the current ISO week. */
  thisWeekSessions: number;
  lastSessionAt: number | null;
}

// ── Seed data ───────────────────────────────────────────────────────────────

/**
 * The 20 built-in exercises from the prototype. Seed these on first run with
 * these exact ids — the routine seeds below reference them.
 */
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

/** Default starting values for a brand-new set of each measurement type. */
export function blankSet(m: MeasurementType): SetRecord {
  switch (m) {
    case 'weight_reps':   return { type: 'work', weight: 20, reps: 10 };
    case 'distance_time': return { type: 'work', dist: 1000, secs: 300 };
    case 'reps_distance': return { type: 'work', reps: 4, dist: 20 };
    case 'calories_time': return { type: 'work', cal: 50, secs: 240 };
    case 'time':          return { type: 'work', secs: 60 };
  }
}

/**
 * How a new session's sets are seeded: copy the sets from the last time this
 * exercise was performed (with `done` cleared), else 3 blank sets for
 * weight×reps and 1 for everything else.
 */
export const DEFAULT_SET_COUNT = { weight_reps: 3, other: 1 } as const;
