# Analytics — exact specification

Everything here is derived from stored sessions at read time. There is no
precomputed aggregate table; the dataset is small (one user, a few thousand sets
a year) and recomputing keeps edits and deletions honest. If profiling ever says
otherwise, memoize per `exerciseId` and invalidate on any session write — do not
denormalize.

All formulas below reference `metrics.ts`.

## 1. Only working sets count

Warm-up sets (`type: 'warmup'`) are **excluded** from best set, PRs, chart and
trend. They are included in set counts on the session card and summary. This is
the single most common source of wrong numbers — bake it into one
`workingSets()` helper rather than filtering ad hoc.

## 2. Best set

For an exercise, iterate every working set of every session and keep the one
with the highest `score(set, measurement)`:

| Measurement | Score | Why |
| --- | --- | --- |
| `weight_reps` | Epley e1RM: `weight × (1 + reps/30)` | Compares 100×3 against 90×8 sensibly |
| `distance_time` | `dist + (secs ? 60/secs : 0)` | Distance dominates; speed breaks ties |
| `reps_distance` | `reps × dist` | Total distance moved |
| `calories_time` | `cal` | Calories are the goal |
| `time` | `secs` | Longer hold is better |

Ties: keep the **earlier** set (first one seen wins), so the "best" date doesn't
churn when a lift is repeated exactly.

Never compare scores across measurement types — the units are incommensurable.

## 3. Secondary stat tile

The second tile on the exercise detail screen depends on measurement type:

| Measurement | Label | Value | Note |
| --- | --- | --- | --- |
| `weight_reps` | Est. 1RM | `round(epley1RM(best) × 4) / 4` in display units | "Epley estimate" |
| `distance_time` | Best pace | `mmss(secs / distanceInLongUnits)` | "per km" / "per mi" |
| `reps_distance` | Total distance | `distStr(reps × dist)` | "in that set" |
| `calories_time` | Cal / min | `round(cal / (secs/60) × 10) / 10` | "in that set" |
| `time` | Total time | `mmss(sum of all secs, all sessions)` | "logged all-time" |

With no data: value `—`, note "no data".

## 4. Personal records

A PR is detected **at finish time**, comparing the session being finished
against everything already stored. The rule differs by measurement type:

**`weight_reps` — one record per distinct weight.** A weight's record is the
most reps ever done at that exact weight; different weights never compete
with each other.

```
for each entry in the finished session where measurement === 'weight_reps':
  bestAtWeight = max reps ever logged at each weight, across all prior sessions
  wonThisSession = {}
  for each WORKING set in this entry, in order:
    if set.reps beats both bestAtWeight[set.weight] (or that weight is new)
       and whatever this session has already logged at that weight:
      wonThisSession[set.weight] = set.reps
  → one PR per entry in wonThisSession
```

Ties don't steal the record (strict `>` only) — an equal rep count at a
previously-seen weight is not a new PR.

**Every other measurement — a single running-best record.**

```
for each entry in the finished session, measurement !== 'weight_reps':
  m     = measurement(entry.exerciseId)
  prior = bestSet(exerciseId)            // computed BEFORE the new session is stored
  top   = highest-scoring WORKING set in this entry
  if top and (!prior or score(top, m) > prior.score):
     → PR { exerciseId, set: top, score: score(top, m) }
```

Notes:

- Compute `prior` (or `bestAtWeight`) **before** inserting the new session, or
  every session PRs against itself.
- First-ever performance of an exercise **is** a PR (`!prior` branch, or any
  brand-new weight). This is intentional — it is a nice first-session moment.
- A single `weight_reps` session can now yield **more than one PR** for the
  same exercise if it sets a new best at more than one weight — this is
  expected, not a bug.
- The same rule (weight-scoped for `weight_reps`, running-best otherwise)
  also drives the **badge** shown on individual logged sets in the live
  session, Exercise detail, and History detail — see `recordBadgeKeys()`.
  Badges are recomputed live from the full timeline on every render rather
  than stored, so editing or deleting a historical set immediately updates
  who holds the record.
- PRs are shown on the summary screen using `prStr()` (the load, e.g. "82.5 kg"),
  not the full set string.
- Store detected PRs on the session record (`prs: PersonalRecord[]`) so the
  summary can be re-opened from history and still be truthful. If a user later
  edits or deletes an earlier session, historical PR flags become
  retrospectively wrong — accept this (it matches the user's lived experience at
  the time) rather than recomputing history.

## 5. Progress chart

```
sessionsWith(exerciseId)               // all sessions containing the exercise
  .sort(ascending performedAt)
  .map(session => top working set by chartValue)
  .filter(exists)
  → take last 8                        // the visible window
```

- Bar height: `pct = (value - floor) / (hi - floor) × 100`, where
  `hi = max(values, 1)`, `lo = min(values, hi)`, and
  `floor = hi === lo ? 0 : lo - (hi - lo) × 0.45`.
  The 45% headroom below the minimum is what makes a 2.5 kg improvement
  visible instead of a flat row of near-full bars.
- Bar label: `chartLabel(value, m, unit)`.
- X label: `shortDate(performedAt)`.
- **Trend** = `chartValue(last.top) - chartValue(first.top)` across the *whole*
  history (not just the visible 8). Render as `+N`/`-N` with the chart unit;
  positive in `--wb-green-text`. Zero → render `—`, not `+0`.
- Fewer than 2 points → hide the trend, still draw the bars.
- No working sets at all → show the empty state (chart glyph + "No sets logged
  yet"), not an empty chart.

## 6. Streaks

The prototype had no real streak logic; this is the specification for it.

Week-based, not day-based — training 4 days a week should not break a "streak".

```
week(ms)  = ISO week key, e.g. "2026-W38", computed in LOCAL time
weeks     = distinct week keys across all sessions, descending

currentWeeks:
  start at this week. If this week has >= 1 session, count it and walk back.
  If this week has none, start the count at LAST week instead (a week is not
  failed until it is over) — but if last week also has none, currentWeeks = 0.
  Walk back while each consecutive week key is present.

longestWeeks: longest run of consecutive week keys anywhere in history.
thisWeekSessions: sessions whose week key === week(now).
lastSessionAt: max performedAt, or null.
```

Edge cases that must be handled: DST shifts (use local midnight boundaries, not
`ms / 604800000`), the ISO week rollover on Sunday/Monday (use ISO — Monday
start), and an empty history (all zeros, `lastSessionAt: null`).

## 7. Session-level numbers

- **Duration** — `max(1, round((finishedAt - startedAt) / 60000))` minutes.
  Computed from timestamps, never accumulated from ticks.
- **Set count** — completed sets only (`done: true`), warm-ups **included**.
- **Elapsed (live)** — always `Date.now() - startedAt`, recomputed on each tick
  and on `visibilitychange`. A phone that slept for 20 minutes must show the
  real elapsed time on wake.
- **Rest timer** — store `endsAt` (epoch ms) + `totalSec`, not `remaining`.
  Default 90s, started automatically when a **working** set is checked. Persist
  it with the live session so a reload mid-rest is correct.

## 8. Last-time values (the "prev" column)

The set-row "previous" column and new-session seeding both come from:

```
lastSets(exerciseId) = the entries.sets of the most recent session
                       (by performedAt desc) containing that exercise
```

Matched **positionally** — set 1 against last time's set 1, and so on. If last
time had fewer sets, show `—`. This is intentionally naive and matches the
prototype; do not get clever about matching by weight or rep range.

Seeding a new session's sets: clone last time's sets with completion cleared. If
there is no history, `blankSet(measurement)` × 3 for `weight_reps`, × 1
otherwise.

## 9. Rounding and display rules

- kg displays to the nearest 0.25; lb to the nearest 2.5.
- Est. 1RM rounds to the nearest 0.25 of the display unit.
- Distances: long unit 2dp, short unit integer.
- Never show `-0`, `NaN`, `Infinity`, or `0:NaN` — a set with a missing field is
  a data bug, but the UI must degrade to `—`.
- All numeric readouts use `font-variant-numeric: tabular-nums` so columns don't
  jitter as values change.

## 10. Tests worth writing

These are the ones that catch real regressions:

1. Epley on a known set: `100 kg × 5` → `116.67`.
2. `dispWeight` round-trips through `inputWeight` in both units within 0.01 kg.
3. A warm-up set heavier than every working set does **not** become the best set.
4. Finishing a `weight_reps` session where every set is at the same weight and
   beats history yields exactly one PR for that weight, not per set; a session
   spanning three different weights, each a new best, yields three PRs.
5. Finishing an empty session stores nothing.
6. Chart floor: 8 sessions at `100,100,100,100,100,100,100,102.5` produces a
   visibly taller last bar (pct difference > 20).
7. Streak across a year boundary (2026-W01 after 2025-W52) stays unbroken.
8. Deleting the only set of an entry removes the entry; deleting the last entry
   leaves a session with zero entries — decide and test: **delete the session**.
