/**
 * Workbook — analytics.
 *
 * Pure functions over stored data (Session[] + Exercise). No React, no DB.
 * Formulas per ANALYTICS.md.
 */

import type {
  ChartPoint, Exercise, ExerciseId, MeasurementType, PersonalRecord,
  Session, SetRecord, StreakStats, WeightUnit,
} from './types';
import { chartLabel, chartUnit, chartValue, dispWeight, distStr, epley1RM, mmss, score } from './metrics';

/** Working (non-warmup) sets only — the single source of truth for this filter. */
export function workingSets(entries: Session['entries'], exerciseId: ExerciseId): SetRecord[] {
  const out: SetRecord[] = [];
  for (const e of entries) {
    if (e.exerciseId !== exerciseId) continue;
    for (const s of e.sets) if (s.type === 'work') out.push(s);
  }
  return out;
}

/** All sessions containing exerciseId, sorted by performedAt ascending. */
export function sessionsForExerciseAsc(sessions: Session[], exerciseId: ExerciseId): Session[] {
  return sessions
    .filter((s) => s.exerciseIds.includes(exerciseId))
    .slice()
    .sort((a, b) => a.performedAt - b.performedAt);
}

export interface BestSet {
  set: SetRecord;
  score: number;
  performedAt: number;
}

/** Highest-scoring working set across all sessions. Ties keep the earlier one. */
export function bestSet(sessions: Session[], exerciseId: ExerciseId, m: MeasurementType): BestSet | null {
  let best: BestSet | null = null;
  const asc = sessionsForExerciseAsc(sessions, exerciseId);
  for (const s of asc) {
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId) continue;
      for (const st of e.sets) {
        if (st.type !== 'work') continue;
        const v = score(st, m);
        if (!best || v > best.score) best = { set: st, score: v, performedAt: s.performedAt };
      }
    }
  }
  return best;
}

/** PR detection at finish time: prior must be computed BEFORE the new session is stored. */
export function detectPRs(
  entries: { exerciseId: ExerciseId; sets: SetRecord[] }[],
  exercises: Record<ExerciseId, Exercise>,
  priorSessions: Session[],
): PersonalRecord[] {
  const prs: PersonalRecord[] = [];
  for (const entry of entries) {
    const ex = exercises[entry.exerciseId];
    if (!ex) continue;
    const m = ex.measurement;

    if (m === 'weight_reps') {
      // One PR per weight: the most reps ever done at that exact weight.
      const bestAtWeight = new Map<number, number>();
      for (const s of sessionsForExerciseAsc(priorSessions, entry.exerciseId)) {
        const e = s.entries.find((x) => x.exerciseId === entry.exerciseId);
        if (!e) continue;
        for (const st of e.sets) {
          if (st.type !== 'work' || st.weight == null || st.reps == null) continue;
          const cur = bestAtWeight.get(st.weight);
          if (cur == null || st.reps > cur) bestAtWeight.set(st.weight, st.reps);
        }
      }
      const wonThisSession = new Map<number, number>();
      for (const st of entry.sets) {
        if (st.type !== 'work' || st.weight == null || st.reps == null) continue;
        const priorBest = bestAtWeight.get(st.weight);
        const sessionBest = wonThisSession.get(st.weight);
        if ((priorBest == null || st.reps > priorBest) && (sessionBest == null || st.reps > sessionBest)) {
          wonThisSession.set(st.weight, st.reps);
        }
      }
      for (const [weight, reps] of wonThisSession) {
        prs.push({ exerciseId: entry.exerciseId, set: { type: 'work', weight, reps }, score: reps, achievedAt: Date.now() });
      }
      continue;
    }

    const prior = bestSet(priorSessions, entry.exerciseId, m);
    let top: SetRecord | null = null;
    let topScore = -Infinity;
    for (const s of entry.sets) {
      if (s.type !== 'work') continue;
      const v = score(s, m);
      if (v > topScore) { topScore = v; top = s; }
    }
    if (top && (!prior || topScore > prior.score)) {
      prs.push({ exerciseId: entry.exerciseId, set: top, score: topScore, achievedAt: Date.now() });
    }
  }
  return prs;
}

export interface SecondaryStat {
  label: string;
  value: string;
  note: string;
}

/** The second stat tile on exercise detail — depends on measurement type. */
export function secondaryStat(
  sessions: Session[], exerciseId: ExerciseId, m: MeasurementType, u: WeightUnit,
): SecondaryStat {
  const best = bestSet(sessions, exerciseId, m);
  if (!best) return { label: '—', value: '—', note: 'no data' };
  switch (m) {
    case 'weight_reps': {
      const v = Math.round(epley1RM(best.set) * 4) / 4;
      return { label: 'Est. 1RM', value: `${dispWeight(v, u)} ${u}`, note: 'Epley estimate' };
    }
    case 'distance_time': {
      const km = (best.set.dist || 0) / 1000;
      const longKm = u === 'lb' ? km * 0.621371 : km;
      const pace = longKm > 0 ? mmss((best.set.secs || 0) / longKm) : '—';
      return { label: 'Best pace', value: pace, note: u === 'lb' ? 'per mi' : 'per km' };
    }
    case 'reps_distance': {
      const total = (best.set.reps || 0) * (best.set.dist || 0);
      return { label: 'Total distance', value: distStr(total, u), note: 'in that set' };
    }
    case 'calories_time': {
      const perMin = best.set.secs ? Math.round(((best.set.cal || 0) / (best.set.secs / 60)) * 10) / 10 : 0;
      return { label: 'Cal / min', value: String(perMin), note: 'in that set' };
    }
    case 'time': {
      const total = sessions.reduce((sum, s) => sum + workingSets(s.entries, exerciseId).reduce((a, x) => a + (x.secs || 0), 0), 0);
      return { label: 'Total time', value: mmss(total), note: 'logged all-time' };
    }
  }
}

/** Progress chart: last 8 sessions' top working set, oldest → newest, plus trend. */
export function progressChart(
  sessions: Session[], exerciseId: ExerciseId, m: MeasurementType, u: WeightUnit,
): { points: ChartPoint[]; allPoints: ChartPoint[]; trend: number | null; unit: string } {
  const asc = sessionsForExerciseAsc(sessions, exerciseId);
  const all: ChartPoint[] = [];
  for (const s of asc) {
    let top: SetRecord | null = null;
    let topVal = -Infinity;
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId) continue;
      for (const st of e.sets) {
        if (st.type !== 'work') continue;
        const v = chartValue(st, m);
        if (v > topVal) { topVal = v; top = st; }
      }
    }
    if (top) all.push({ performedAt: s.performedAt, value: topVal, label: chartLabel(topVal, m, u) });
  }
  const points = all.slice(-8);
  let trend: number | null = null;
  if (all.length >= 2) trend = all[all.length - 1].value - all[0].value;
  return { points, allPoints: all, trend, unit: chartUnit(m, u) };
}

/** Bar heights for the chart — 45% headroom below the minimum. */
export function chartBarPct(values: number[]): number[] {
  if (!values.length) return [];
  const hi = Math.max(...values, 1);
  const lo = Math.min(...values, hi);
  const floor = hi === lo ? 0 : lo - (hi - lo) * 0.45;
  return values.map((v) => (hi === floor ? 100 : ((v - floor) / (hi - floor)) * 100));
}

// ── Streaks ──────────────────────────────────────────────────────────────

function isoWeekKey(ms: number): string {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  // ISO week: Thursday of this week determines the year.
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const fDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 864e5));
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekBefore(key: string): string {
  // Reconstruct the Thursday of `key`, subtract 7 days, recompute the key.
  const [yStr, wStr] = key.split('-W');
  const year = Number(yStr);
  const week = Number(wStr);
  const firstThursday = new Date(year, 0, 4);
  const fDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fDay + 3);
  const thursday = new Date(firstThursday.getTime() + (week - 1) * 7 * 864e5);
  return isoWeekKey(thursday.getTime() - 7 * 864e5);
}

export function streakStats(sessions: Session[], now = Date.now()): StreakStats {
  if (!sessions.length) return { currentWeeks: 0, longestWeeks: 0, thisWeekSessions: 0, lastSessionAt: null };

  const weekSet = new Set(sessions.map((s) => isoWeekKey(s.performedAt)));
  const thisWeek = isoWeekKey(now);
  const thisWeekSessions = sessions.filter((s) => isoWeekKey(s.performedAt) === thisWeek).length;
  const lastSessionAt = Math.max(...sessions.map((s) => s.performedAt));

  let currentWeeks = 0;
  let cursor = weekSet.has(thisWeek) ? thisWeek : weekBefore(thisWeek);
  if (weekSet.has(cursor)) {
    while (weekSet.has(cursor)) {
      currentWeeks++;
      cursor = weekBefore(cursor);
    }
  }

  // Longest run anywhere in history.
  const sortedWeeks = Array.from(weekSet).sort();
  let longestWeeks = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const wk of sortedWeeks) {
    if (prevKey && weekBefore(wk) === prevKey) run++;
    else run = 1;
    longestWeeks = Math.max(longestWeeks, run);
    prevKey = wk;
  }

  return { currentWeeks, longestWeeks, thisWeekSessions, lastSessionAt };
}

// ── Last-time values ─────────────────────────────────────────────────────

/** Most recent session's sets for an exercise, matched positionally. */
export function lastSets(sessions: Session[], exerciseId: ExerciseId): SetRecord[] {
  const sorted = sessions
    .filter((s) => s.exerciseIds.includes(exerciseId))
    .slice()
    .sort((a, b) => b.performedAt - a.performedAt);
  const s = sorted[0];
  if (!s) return [];
  const entry = s.entries.find((e) => e.exerciseId === exerciseId);
  return entry ? entry.sets : [];
}

export function cloneSetAsUndone(s: SetRecord): SetRecord {
  return { type: s.type, weight: s.weight, reps: s.reps, dist: s.dist, secs: s.secs, cal: s.cal };
}

// ── Personal-record badges ──────────────────────────────────────────────

export interface RecordSource {
  id: string;
  performedAt: number;
  entries: { exerciseId: ExerciseId; sets: SetRecord[] }[];
}

/**
 * Keys (`${sourceId}:${setIndex}`) of the sets that currently hold a record
 * for this exercise, resolved across the whole timeline.
 *
 * weight_reps: one record per distinct weight — the most reps ever done at
 * that exact weight. Everything else: a single running-best record by score.
 * Ties keep the earlier set; a later set only takes the badge by beating it.
 */
export function recordBadgeKeys(sources: RecordSource[], exerciseId: ExerciseId, m: MeasurementType): Set<string> {
  const asc = sources
    .filter((s) => s.entries.some((e) => e.exerciseId === exerciseId))
    .slice()
    .sort((a, b) => a.performedAt - b.performedAt);

  const keys = new Set<string>();

  if (m === 'weight_reps') {
    const bestAtWeight = new Map<number, { key: string; reps: number }>();
    for (const s of asc) {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry) continue;
      for (let idx = 0; idx < entry.sets.length; idx++) {
        const st = entry.sets[idx];
        if (st.type !== 'work' || st.weight == null || st.reps == null) continue;
        const cur = bestAtWeight.get(st.weight);
        if (!cur || st.reps > cur.reps) bestAtWeight.set(st.weight, { key: `${s.id}:${idx}`, reps: st.reps });
      }
    }
    for (const v of bestAtWeight.values()) keys.add(v.key);
  } else {
    let bestKey: string | null = null;
    let bestScore = -Infinity;
    for (const s of asc) {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry) continue;
      for (let idx = 0; idx < entry.sets.length; idx++) {
        const st = entry.sets[idx];
        if (st.type !== 'work') continue;
        const v = score(st, m);
        if (v > bestScore) { bestScore = v; bestKey = `${s.id}:${idx}`; }
      }
    }
    if (bestKey) keys.add(bestKey);
  }

  return keys;
}
