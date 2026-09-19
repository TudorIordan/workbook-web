# Changelog

Design updates pulled from the Workbook design project and implemented in the
app. Newest first.

## 2026-09-19 — Editing, PRs, and reordering

**Routine editor — drag to reorder**
Grip handle (6-dot, right side of each exercise row) drags to reorder; the
held row lifts with a shadow, neighbours slide out of the way, and the
numbering re-renders on drop. Travel is clamped to the list bounds (±14px
slack). The grip alone captures the pointer (`touch-action: none`) — taps on
✕ or the exercise name are unaffected.

Not carried over from the prototype: pointer-delta normalization by the
phone frame's scale factor. That compensates for the prototype's scaled
device bezel and has no equivalent in the real app, which renders at 1:1.

**Exercise page navigation**
Exercise titles are tappable in the routine editor, the live session card,
and History detail — they open that exercise's log history + graph. Back
returns to wherever the tap originated (live session, History detail, or the
routine editor with its draft intact — the draft now survives the round trip
via an in-memory store). Chevron affordance on session and history cards;
none on routine editor rows.

**History detail — full edit mode**
Tap any value chip to edit via the number pad, writing straight to the
logged set. Swipe a set left to delete; removing an exercise's last set drops
the exercise. ✕ on an exercise card removes that exercise from the workout.
"Delete workout" requires a second tap within 3 seconds. The workout name is
an inline editable field in the header. Added the helper line: "Tap a value
to edit · swipe a set left to delete."

**Visual fixes**
Unit labels in value chips raised to .78 ink opacity. The brick delete
underlay no longer bleeds at rest — the delete panel carries the color
itself (inset 1px, 74px wide) and only appears on swipe. Applied to History
detail, Exercise detail, and the live session's set rows.

**Personal records**
PR calculation: for weight × reps, the record at a given weight is the most
reps ever done at that exact weight — one PR per weight; every other metric
uses a running best. Badges mark the current holder, resolved across the
whole timeline: beating an old set removes its badge; ties don't steal it.
Display treatment: brick ring + brick numerals + a micro "PR" mark on the
chip that made the record. Shown in the live session, Exercise detail's
history, and History detail. The finish-workout PR list (Summary) uses the
same per-weight calculation.

Not implemented: the "focus" session log style referenced alongside "rows" —
`LogStyle` exists in the data model but has no UI in this app, so PR badges
and the swipe/visual fixes above were only applied to the one session style
that ships.

**Set rows**
Checked rows use the sand tint instead of mint green. Swipe-to-delete panels
inset 1px and narrowed to 74px. Tapping the Prev value copies those values
into the row; inert when there's nothing to apply.

**Calendar & history**
Days with two or more workouts show a marker and open a day sheet listing
each one (time, duration, sets, exercises); single days go straight to
detail. Heatmap intensity sums the day's sets across every session on that
day, not just the last one recorded.

Note: this app ships the heatmap variant (not the calendar variant) as its
shipped history view, per the existing `UI_SPEC.md` — the day-sheet and
summed-intensity behavior above was implemented against the heatmap, its
real equivalent. No synthetic same-day demo session was added to the
production seed data (`data/seed.ts`) — that seed only creates exercises,
routines, and settings, deliberately shipping with zero history for real
users; a "second same-day session" is prototype demo data only.

**Workouts**
Quick workouts named by clock: Morning / Afternoon / Evening / Night
workout. The Summary screen's title is editable and renames the saved
workout live.

**Exercise page**
Chart card is now a two-page swipe pager: bars, then a time-proportional line
chart of every session with a dot per workout, area fill, hi/lo values, and
date range. Single-session state shows "Log this exercise again to plot a
trend" instead of an empty page.

**Settings**
Removed the "Start it after" rest-scope control from the UI. The underlying
`restScope` setting and its logic in the rest-timer trigger are untouched —
it just always reads its default (`'weights'`) now, with no way to change it
from Settings.
