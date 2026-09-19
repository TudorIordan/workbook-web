# Interactions

Timings, gestures and guards. These were tuned on the prototype and are part of
the design — matching the pixels but not these numbers gets you a different app.

---

## Motion vocabulary

| Token | Value | Used by |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | every transform |
| Overlay fade | `wbFade` 160ms (detail/history/routine), 180ms (session, settings), 200ms (summary) | full-screen panels |
| Sheet rise | `wbUp` 200ms (keypad), 220ms (picker, rest bar) — `translateY(110%) → 0` | bottom sheets, rest bar |
| Row settle | `transform .2s var(--ease-out)` | swipe-to-delete release |
| Switch | `background .18s ease` + `transform .18s var(--ease-out)` | settings toggles |
| Press | `transform: scale(.96)` keypad keys, `.985` large CTAs | tactile feedback |

```css
@keyframes wbUp   { from { transform: translateY(110%); } to { transform: translateY(0); } }
@keyframes wbFade { from { opacity: 0; } to { opacity: 1; } }
```

Under `prefers-reduced-motion: reduce`, keep the opacity fades and drop the
translate/scale.

---

## Swipe to delete

Applies to all four logged-set surfaces: live-session set rows, Exercise
detail's logged sets, History detail's logged sets, and (when it ships) the
focus-mode session card. `mobile/15-set-swipe-delete.png`.

The delete panel is **inset 1px on top/bottom/right and 74px wide** — it
carries its own `--wb-brick` background rather than the row wrapper, so
nothing bleeds at rest; only the panel itself is ever brick-colored.

1. `pointerdown` records the start x, the row key, and the current base offset
   (`-75` — panel width + inset — if this row is already latched open, else
   `0`). **Do not capture the pointer yet.**
2. `pointermove`: once `|dx| > 7` the gesture is a drag — only then call
   `setPointerCapture`. Capturing on `pointerdown` retargets the subsequent
   `click` to the row and kills every tap on the cells inside it.
3. While dragging, `x = clamp(base + dx, -91, 0)`; transform applies with
   `transition: none`.
4. `pointerup`: latch open at `-75px` if released past `-37.5px`, otherwise
   snap back to `0`. Release the pointer capture; re-enable the transition.
5. After any drag, set a 250ms guard timestamp. Every tap handler inside the row
   runs through `guard(fn)`: if the guard is still warm, swallow the tap; if a
   row is latched open, the first tap anywhere closes it instead of acting.

Gesture bookkeeping (start x, base, moved flag, capture id, guard timestamp)
lives **outside** React state — only the visual offset re-renders. The row is
`touch-action: pan-y` so vertical scrolling still belongs to the page.

Deleting the last set of an exercise removes the exercise from the session
(live session) or from that logged workout (History detail, Exercise detail).

Tapping the **Prev** cell in a live-session row copies that set's weight/reps
(or distance/time/etc.) straight into the current row — inert (no tap target)
when there's nothing to apply.

---

## Reordering a routine (drag handle)

A 6-dot grip sits at the right edge of each exercise row in the routine
editor, separate from the ✕ remove button — dragging the row itself does
nothing; only the grip starts a reorder.

1. `pointerdown` on the grip captures the pointer immediately (no move
   threshold — this is a dedicated handle, not a tap target that also needs
   to scroll or click).
2. While dragging, the held row translates by the raw pointer delta, clamped
   to the list bounds with **14px of slack** past the first/last row so it
   doesn't fly over the header or the CTA below.
3. Every other row shifts by one row-height, up or down, whenever the pointer
   crosses into their slot — they animate with the row-settle transition so
   they visibly slide out of the way.
4. `pointerup` commits the reorder in one step: the array is spliced from the
   original index to the hovered index, and the numbering re-renders.

Taps on the ✕ remove button and on the exercise name (which opens Exercise
detail) are unaffected — they're separate elements with their own handlers,
not part of the draggable surface.

---

## Cross-screen navigation

Exercise names are tappable wherever a set is logged — the live session card,
the routine editor row (no chevron there — the affordance is the row's own
tap target), History detail, and Exercise detail's own history list — and
push `/exercise/:id` rather than replacing, so the back chevron returns to
wherever the tap originated. A routine editor draft (name + exercise order,
unsaved) survives that round trip via an in-memory draft store keyed by the
routine id (or `'new'`) — it isn't lost just because the screen unmounted.

---

## Personal-record badges

A badge marks whichever specific logged set currently holds the record for
its exercise, resolved fresh across the whole timeline on every render (not
stored per-session):

- **Weight × reps**: one record **per distinct weight** — the most reps ever
  done at that exact weight. A different weight never competes with another.
- **Every other measurement**: a single running-best record by the same
  score function used for the exercise's "Best set" tile.
- Ties keep the earlier set — a later set only takes the badge by strictly
  beating it. Beating an old set removes its badge immediately.

Treatment: a `1.5px` brick ring and brick-colored numerals on **one** value
chip per set — the field the record is actually scored on (`reps` for weight
× reps, `distance`/`reps`/`calories` for the others, the sole field for
time-only) — plus a micro "PR" mark on that same chip. The weight/distance-
pair chip next to it stays unstyled; see `PR_FIELD_INDEX` in `domain/types.ts`.
Shown in
the live session (computed against the in-progress values, not just `done`
ones), Exercise detail's logged-sets list, and History detail. The
finish-workout PR list (Summary) uses the identical per-weight calculation.

---

## Editing a value

1. Tap a value cell → keypad sheet opens for `{entry, set, field}` with an empty
   buffer. The readout shows the set's **current** value until the first digit.
2. Each key press rewrites the buffer and writes through to the set immediately,
   so the row behind the sheet updates live.
3. Backspace to an empty buffer shows the current value again and **must not
   write** — an empty buffer is not `0`.
4. `.` is ignored if the buffer already has one; a leading `0` is replaced by the
   first digit; `00` (duration fields) appends two zeros.
5. Duration fields parse the digit string as `m:ss` (`930` → `9:30`) and store
   seconds.
6. Done or a backdrop tap closes; there is no cancel — every keystroke has
   already been committed.
7. Values are written in display units and converted to canonical storage units
   on the way in (`DATA_MODEL.ts`, `metrics.ts`).

Steppers (`±`) mutate directly with per-field steps: weight 2.5 (kg) / 5 (lb),
reps 1, seconds 5, distance 0.1 km / 10 m, calories 1. Weight clamps at 0 and
rounds to 2 decimals; reps clamp at 1.

History detail is **not read-only**: every value chip opens the same keypad
sheet and writes straight into that stored session (not just Exercise
detail's history list). Removing a set behaves exactly as in the live
session; an exercise card's ✕ removes that whole exercise from the workout;
"Delete workout" requires a second tap within 3 seconds to confirm. The
workout name itself is an inline editable field in the header, committed on
blur.

---

## Completing a set

Tapping the tick sets `done = true` and, if the rest timer applies, starts the
countdown. Untapping clears `done` but leaves a running timer alone.

The timer starts only when **all** of these hold:

```
settings.restEnabled
&& (set.type !== 'warmup' || settings.restWarmup)
&& (settings.restScope === 'all' || exercise.metric === 'weight_reps')
```

Countdown length is `settings.restLen` (default 90s, range 15–600, step 15).
`+15s` extends both remaining and total; `Skip` clears it. The bar disappears at
zero — no sound, no vibration in the prototype; if you add one, gate it behind a
setting.

---

## Session lifecycle

- **Start** from a routine (pre-fills every exercise with last session's sets,
  including warm-ups on the first exercise) or empty.
- **Minimise** keeps the session alive and shows the mini bar; tapping the bar
  or the sidebar card resumes.
- **Finish** keeps only `done` sets, drops exercises left with none, computes
  duration from `startedAt`, detects PRs against prior bests, writes the session
  record and opens the summary. A session with nothing done writes no record.
- **Discard** drops everything without confirmation in the prototype — add a
  confirm in production.
- **Elapsed time** must be recomputed from `Date.now() - startedAt` on every
  tick and on `visibilitychange`; never accumulate interval ticks (they stall
  when the tab is backgrounded). One 1s interval drives both the clock and the
  rest countdown.

---

## Calendar / heatmap days

A day's intensity sums the working sets across **every** session on that day,
not just the last one written. Days with two or more sessions get a small
marker dot; tapping such a day opens a sheet listing each session (time,
duration, sets, exercise count) instead of jumping straight to one. A single-
session day still opens History detail directly.

---

## Filtering and search

- Muscle and equipment filters are independent and combine with the search
  string; all three are case-insensitive substring matches on the name.
- The empty state names what was filtered: "No legs exercises with barbell
  matching "x"." — build the sentence from the active filters, don't ship a
  generic string.
- In the picker, typing a name that matches nothing reveals the create card
  inline (threshold: more than 1 character and no exact name match).

---

## Keyboard and assistive access

The prototype is tap-only. Production must add:

- Real `<button>` / `<input type="checkbox">` semantics for every cell that is
  currently a `<div onClick>` — most importantly the set tick, value cells and
  filter chips.
- `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`
  everywhere (the design system's rule).
- A keyboard path for swipe-to-delete (a visible delete action in the row's
  context menu, or long-press → menu).
- Live-region announcements for "set logged", rest countdown start/end, and PRs.
- The set row should read as "Set 3, 72.5 kilograms, 8 reps, not done" — label
  the value cells, don't leave bare numbers.

---

## Exercise progress chart

The chart card is a two-page swipe pager, not a single bar chart: page one is
the existing 8-session bar chart, page two is a time-proportional line chart
across every session for that exercise — a dot per workout, an area fill, hi
and low value callouts, and the full date range underneath. Horizontal drag
past 40px on either page flips it; two dots below double as tap targets.
With exactly one logged session there's nothing to draw a trend from — show
"Log this exercise again to plot a trend" instead of an empty second page.

---

## Persistence points

Write on every one of these, not on a debounce:

| Event | What is written |
| --- | --- |
| Value edit, tick, add/remove set, add/remove exercise | the live session draft |
| Finish | the session record + the live draft is cleared |
| Any settings change | `unit`, `theme`, `restEnabled`, `restLen`, `restScope`, `restWarmup` |
| Routine save/delete | the routine list |
| Custom exercise create | the exercise list |

A reload mid-workout must land the user back on the session screen with every
logged set intact (`PERSISTENCE.md`).
