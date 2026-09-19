/**
 * Workbook — units, formatting and scoring.
 *
 * A faithful TypeScript port of the prototype's formatting layer. This is the
 * ONLY place that knows about display units; everything else deals in canonical
 * kg / metres / seconds / kcal (see DATA_MODEL.ts).
 *
 * Pure functions, no app state — pass `unit` explicitly so this is trivially
 * testable and usable from a worker.
 */

import {
  MEASUREMENTS, type FieldKey, type MeasurementType, type SetRecord,
  type WeightUnit,
} from './types';

const LB_PER_KG = 2.20462;
const MI_PER_M = 0.000621371;
const YD_PER_M = 1.09361;

const imperial = (u: WeightUnit) => u === 'lb';

// ── Unit conversion ─────────────────────────────────────────────────────────

/** kg → display weight, rounded to the unit's sensible precision. */
export function dispWeight(kg: number | undefined, u: WeightUnit): number {
  if (!kg) return 0;
  return u === 'kg'
    ? Math.round(kg * 4) / 4                 // nearest 0.25 kg
    : Math.round((kg * LB_PER_KG) / 2.5) * 2.5; // nearest 2.5 lb
}

/** Display weight → kg. */
export function inputWeight(v: number, u: WeightUnit): number {
  return imperial(u) ? v / LB_PER_KG : v;
}

/** metres → km or mi, 2dp. */
export function dispLongDist(m: number | undefined, u: WeightUnit): number {
  const v = imperial(u) ? (m || 0) * MI_PER_M : (m || 0) / 1000;
  return Math.round(v * 100) / 100;
}

/** metres → m or yd, integer. */
export function dispShortDist(m: number | undefined, u: WeightUnit): number {
  return Math.round(imperial(u) ? (m || 0) * YD_PER_M : m || 0);
}

export const longUnit = (u: WeightUnit) => (imperial(u) ? 'mi' : 'km');
export const shortUnit = (u: WeightUnit) => (imperial(u) ? 'yd' : 'm');

/** Weight step: 2.5 kg, or 2.5 lb expressed in kg. */
export const weightStep = (u: WeightUnit) => (u === 'kg' ? 2.5 : 2.5 / LB_PER_KG);

export function mmss(sec: number | undefined): string {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Distance with an automatic unit: ">= 1 km/mi" switches to the long unit. */
export function distStr(m: number | undefined, u: WeightUnit): string {
  const long = dispLongDist(m, u);
  return long >= 1
    ? `${long} ${longUnit(u)}`
    : `${dispShortDist(m, u)} ${shortUnit(u)}`;
}

// ── Field accessors ─────────────────────────────────────────────────────────

/** Short column header for a field. */
export function fieldHead(f: FieldKey, u: WeightUnit): string {
  switch (f) {
    case 'weight': return u;
    case 'reps':   return 'Reps';
    case 'distkm': return longUnit(u);
    case 'distm':  return shortUnit(u);
    case 'secs':   return 'Time';
    case 'cal':    return 'Cal';
  }
}

/** Long name, used as the keypad sheet title. */
export function fieldName(f: FieldKey, u: WeightUnit): string {
  switch (f) {
    case 'weight': return `Weight (${u})`;
    case 'reps':   return 'Reps';
    case 'distkm': return `Distance (${longUnit(u)})`;
    case 'distm':  return `Distance (${shortUnit(u)})`;
    case 'secs':   return 'Time (mm:ss)';
    case 'cal':    return 'Calories';
  }
}

/** The value as shown in a cell. */
export function fieldValue(s: SetRecord, f: FieldKey, u: WeightUnit): string | number {
  switch (f) {
    case 'weight': return dispWeight(s.weight, u);
    case 'reps':   return s.reps ?? 0;
    case 'distkm': return dispLongDist(s.dist, u);
    case 'distm':  return dispShortDist(s.dist, u);
    case 'secs':   return mmss(s.secs);
    case 'cal':    return s.cal ?? 0;
  }
}

/** Canonical value, for arithmetic. */
export function fieldRaw(s: SetRecord, f: FieldKey): number {
  switch (f) {
    case 'weight': return s.weight || 0;
    case 'reps':   return s.reps || 0;
    case 'distkm':
    case 'distm':  return s.dist || 0;
    case 'secs':   return s.secs || 0;
    case 'cal':    return s.cal || 0;
  }
}

/** ± stepper increment, in canonical units. */
export function fieldStep(f: FieldKey, u: WeightUnit): number {
  switch (f) {
    case 'weight': return weightStep(u);
    case 'reps':   return 1;
    case 'distkm': return imperial(u) ? 160.934 : 100; // 0.1 mi / 100 m
    case 'distm':  return imperial(u) ? 4.572 : 5;     // 5 yd / 5 m
    case 'secs':   return 15;
    case 'cal':    return 5;
  }
}

/** Write a canonical value. Immutable variant — returns a new set. */
export function withField(s: SetRecord, f: FieldKey, canonical: number): SetRecord {
  switch (f) {
    case 'weight': return { ...s, weight: canonical };
    case 'reps':   return { ...s, reps: canonical };
    case 'distkm':
    case 'distm':  return { ...s, dist: canonical };
    case 'secs':   return { ...s, secs: canonical };
    case 'cal':    return { ...s, cal: canonical };
  }
}

/** Write a value the user typed in DISPLAY units, converting + clamping. */
export function withUserInput(
  s: SetRecord, f: FieldKey, typed: number, u: WeightUnit,
): SetRecord {
  switch (f) {
    case 'weight': return withField(s, f, inputWeight(typed, u));
    case 'reps':   return withField(s, f, Math.max(0, Math.round(typed)));
    case 'distkm': return withField(s, f, imperial(u) ? typed * 1609.34 : typed * 1000);
    case 'distm':  return withField(s, f, imperial(u) ? typed / YD_PER_M : typed);
    case 'secs':   return withField(s, f, Math.max(0, Math.round(typed)));
    case 'cal':    return withField(s, f, Math.max(0, Math.round(typed)));
  }
}

/** Applied after a ± tap, per field. */
export function bump(
  s: SetRecord, f: FieldKey, dir: 1 | -1, u: WeightUnit,
): SetRecord {
  const next = fieldRaw(s, f) + dir * fieldStep(f, u);
  if (f === 'reps') return withField(s, f, Math.max(1, Math.round(next)));
  if (f === 'secs' || f === 'cal') return withField(s, f, Math.max(0, Math.round(next)));
  return withField(s, f, Math.max(0, Math.round(next * 100) / 100));
}

// ── Set summary strings ─────────────────────────────────────────────────────

/** Full form, e.g. "82.5 kg × 5", "3.2 km · 17:00". */
export function setStr(s: SetRecord, m: MeasurementType, u: WeightUnit): string {
  switch (m) {
    case 'weight_reps':   return `${dispWeight(s.weight, u)} ${u} × ${s.reps}`;
    case 'distance_time': return `${distStr(s.dist, u)} · ${mmss(s.secs)}`;
    case 'reps_distance': return `${s.reps} × ${dispShortDist(s.dist, u)} ${shortUnit(u)}`;
    case 'calories_time': return `${s.cal} cal · ${mmss(s.secs)}`;
    case 'time':          return mmss(s.secs);
  }
}

/** Compact form for dense rows, e.g. "82.5×5". */
export function shortStr(s: SetRecord, m: MeasurementType, u: WeightUnit): string {
  switch (m) {
    case 'weight_reps':   return `${dispWeight(s.weight, u)}×${s.reps}`;
    case 'distance_time': return `${dispLongDist(s.dist, u)} ${longUnit(u)}`;
    case 'reps_distance': return `${s.reps}×${dispShortDist(s.dist, u)}`;
    case 'calories_time': return `${s.cal} cal`;
    case 'time':          return mmss(s.secs);
  }
}

/** The headline value for a PR line — the load, not the whole set. */
export function prStr(s: SetRecord, m: MeasurementType, u: WeightUnit): string {
  switch (m) {
    case 'weight_reps':   return `${dispWeight(s.weight, u)} ${u}`;
    case 'distance_time': return distStr(s.dist, u);
    case 'reps_distance': return `${s.reps} × ${dispShortDist(s.dist, u)} ${shortUnit(u)}`;
    case 'calories_time': return `${s.cal} cal`;
    case 'time':          return mmss(s.secs);
  }
}

export const separatorFor = (m: MeasurementType) => MEASUREMENTS[m].separator;

// ── Scoring (see ANALYTICS.md for rationale) ────────────────────────────────

/** Epley estimated one-rep max. Only meaningful for weight_reps. */
export function epley1RM(s: SetRecord): number {
  return (s.weight || 0) * (1 + (s.reps || 0) / 30);
}

/**
 * "Which set is better" — used for best-set and PR detection.
 * Deliberately measurement-specific; never compare scores across types.
 */
export function score(s: SetRecord, m: MeasurementType): number {
  switch (m) {
    case 'weight_reps':   return epley1RM(s);
    case 'distance_time': return (s.dist || 0) + (s.secs ? 60 / s.secs : 0);
    case 'reps_distance': return (s.reps || 0) * (s.dist || 0);
    case 'calories_time': return s.cal || 0;
    case 'time':          return s.secs || 0;
  }
}

/** The value plotted on the progress chart (simpler than `score`). */
export function chartValue(s: SetRecord, m: MeasurementType): number {
  switch (m) {
    case 'weight_reps':   return s.weight || 0;
    case 'distance_time': return s.dist || 0;
    case 'reps_distance': return (s.reps || 0) * (s.dist || 0);
    case 'calories_time': return s.cal || 0;
    case 'time':          return s.secs || 0;
  }
}

/** Bar label for a chart value. */
export function chartLabel(v: number, m: MeasurementType, u: WeightUnit): string {
  switch (m) {
    case 'weight_reps':   return String(dispWeight(v, u));
    case 'distance_time': return String(dispLongDist(v, u));
    case 'reps_distance': return String(dispShortDist(v, u));
    case 'calories_time': return String(Math.round(v));
    case 'time':          return mmss(v);
  }
}

/** Y-axis unit shown next to the chart title. */
export function chartUnit(m: MeasurementType, u: WeightUnit): string {
  switch (m) {
    case 'weight_reps':   return u;
    case 'distance_time': return longUnit(u);
    case 'reps_distance': return shortUnit(u);
    case 'calories_time': return 'cal';
    case 'time':          return 'min';
  }
}

// ── Relative dates ──────────────────────────────────────────────────────────

export function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ago(ms: number, now = Date.now()): string {
  const days = Math.round((now - ms) / 864e5);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return 'last week';
  return `${Math.floor(days / 7)}w ago`;
}
