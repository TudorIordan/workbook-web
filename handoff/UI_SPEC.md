# UI specification

Every screen, every state, measured off the approved prototype. Numbers here are
**CSS pixels at 1× on the phone layout (412 pt wide)**; they are the literal
values in the prototype, not approximations. Colours are token names — resolve
them in `DESIGN_TOKENS.md`.

Read this alongside `screenshots/INDEX.md`: each section names the exact capture
that shows it, phone and desktop.

- Component-level recipes (buttons, chips, rows, sheets): `COMPONENTS.md`
- Gestures, timing, guards, keyboard: `INTERACTIONS.md`
- Fonts and the type ramp: `TYPOGRAPHY.md`
- Icons: `icons/ICONS.md` + `icons/index.html`

---

## 1. Canvas, breakpoint, shell

| | Phone | Desktop |
| --- | --- | --- |
| Reference size | 412 × 892 | ≥ 900 wide (captures at 1232 × 720) |
| Trigger | `innerWidth < 900` | `innerWidth ≥ 900` |
| Chrome | bottom tab bar | 264px fixed sidebar, `--wb-inv` |
| Content column | full width, 18px gutters | same screens, `max-width: 980px`, centred |
| Overlays | cover the whole viewport | cover the content area only — the sidebar stays visible and live |

The phone screenshots are rendered inside a mock Android bezel in the prototype;
the bezel is **not** part of the product. Everything inside the 412 × 892 screen
is.

Root element: `position: relative; overflow: hidden; background: var(--wb-bg);
color: var(--wb-ink); font-size: 15px`. Every screen inside is
`position: absolute; inset: 0` — the app never scrolls the document, only
panels.

### Layer stack

| z | Layer | Dismiss |
| --- | --- | --- |
| — | Tab screens (Workout / Exercises / History) | — |
| 6 | Bottom nav | — |
| 7 | Mini bar (live session, minimised) | tap = resume |
| 8 | Live session | minimise chevron (keeps session) |
| 9 | Exercise detail · History detail · Routine editor | back chevron |
| 10 | Summary · Settings | Done / back chevron |
| 11 | Exercise picker sheet | Cancel, backdrop |
| 12 | Numeric keypad sheet | Done, backdrop |

Overlays at z9–z10 are opaque `--wb-bg` panels with `animation: wbFade .16–.2s`.
Sheets at z11–z12 sit on `rgba(var(--wb-shad-rgb), .42)` and rise with
`animation: wbUp .2–.22s`.

### Scroll containers

Every scroller carries `class="wbScroll"` (scrollbars hidden). Tab screens use
`padding: 0 0 118px` so the last card clears the nav bar. The live session's
scroller uses `padding: 16px 16px 130px` (clears the rest bar too).

---

## 2. Workout tab

`mobile/01-workout-home.png` · `desktop/01-workout-home.png` ·
dark: `mobile/dark-01-workout-home.png`

The shipped home is the **templates** variant: routines are the content, no hero.

| Element | Spec |
| --- | --- |
| Screen block | `display: flex; flex-direction: column; gap: 18px; padding: 20px 18px 0; max-width: 980px; margin: 0 auto` |
| Title | "Workout" — Caprasimo 30 / line-height 1 |
| Settings button | 40px circle, `1px solid rgba(ink, .14)`, gear 20px stroke 1.9, ink at 62%; hover `background: rgba(ink, .06)` |
| Primary row | two controls, `gap: 10px` |
| — Empty workout | `flex: 1`, pill `padding: 13px`, `--wb-sel` on `--wb-sel-fg`, 14/700, plus icon 16px stroke 2.4 |
| — New routine | 48px circle, `1px solid rgba(ink, .16)`, note-plus icon 18px |
| Section eyebrow | "Routines" — 11px / 700 / uppercase / `letter-spacing: .1em`, ink 50% |
| Routine row | `padding: 14px 15px`, radius 26, `--wb-surf`, `box-shadow: 0 1px 2px rgba(shad, .12)`, `gap: 13px` |
| — Initial badge | 42px, radius 15, muscle tint of the first exercise, Caprasimo 17 |
| — Name | Caprasimo 18 / 1.15 |
| — Exercise list | 12px, ink 55%, single line, ellipsis |
| — Start | 40px circle, `--wb-brick`, filled play glyph 14px. Tap starts the session immediately; tapping the row opens the editor instead |

Empty library of routines is not a state that ships — three seeded routines are
created on first run (see `PERSISTENCE.md`).

**Desktop:** identical column, centred at 980px, with the sidebar carrying the
"New workout" CTA and nav. The settings gear is dropped from the header there —
Settings is a sidebar row.

---

## 3. Exercises tab

`mobile/02-exercises.png` · `desktop/02-exercises.png` ·
filtered: `mobile/03-exercises-filtered.png` ·
empty: `mobile/04-exercises-empty.png` · dark: `mobile/dark-02-exercises.png`

Sticky header (`position: sticky; top: 0; z-index: 3; background: var(--wb-bg)`),
`padding: 20px 18px 12px`:

| Element | Spec |
| --- | --- |
| Title | "Exercises" — Caprasimo 30, `margin-bottom: 12px` |
| Search field | pill, `--wb-line` fill, `padding: 10px 14px`, `gap: 9px`; search icon 16px at 45% opacity; input 14px, transparent, no border |
| Create button | 44px circle, `--wb-brick`, plus 20px stroke 2.6, `box-shadow: 0 6px 16px rgba(accent, .24)` |
| Muscle chips | horizontal scroll, `gap: 7px`, chips `padding: 6px 13px`, radius 999, 12/700. Selected `--wb-sel` / `--wb-sel-fg`; idle `--wb-line` / ink 60% |
| Equipment chips | same metrics plus a 13px equipment icon; selected chip also carries its ring shadow |

Both chip rows bleed to the screen edge with `margin: 0 -18px; padding: 0 18px`.

List: `display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 8px` — one column on phone, two or three on desktop.

| Row part | Spec |
| --- | --- |
| Row | `padding: 13px 15px`, radius 22, `--wb-surf`, `gap: 12px` |
| Initial badge | 38px, radius 13, muscle tint, Caprasimo 14 |
| Name | 15/700, ellipsis |
| Sub | `{muscle} · {equipment}` (+ measurement label when it is not weight × reps), 12px, ink 55% |
| Right rail | best set Caprasimo 15 / 1.1, relative date 11px ink 45% |

**Empty state** (`04`): 52px `--wb-line` circle with a 23px search glyph,
"Nothing matches" Caprasimo 18, a generated sentence naming the active filters
(13px, ink 65%, `max-width: 230px`), then two pills — "Clear filters"
(`--wb-line`) and "New exercise" (`--wb-sel`), `padding: 11px 20px`.

---

## 4. History tab

`mobile/07-history.png` · `desktop/05-history.png` · dark: `mobile/dark-03-history.png`

Header block `padding: 20px 18px 14px`, title Caprasimo 30.

**Month calendar** (shipped variant) — card radius 26, `--wb-surf`,
`padding: 14px 14px 12px`, `max-width: 430px`:

- Month stepper: 30px circular hit areas, chevrons 16px stroke 2.4; the forward
  arrow drops to `opacity: .3` (ink 20%) at the current month.
- Label: Caprasimo 16, centred.
- Weekday row: 10px / 700 / `letter-spacing: .06em`, ink 50%, 7-col grid `gap: 3px`.
- Day cells: `aspect-ratio: 1`, circle, 12/700. A day with a session is filled
  `--wb-brick` with `--wb-sel-fg` text; today carries
  `box-shadow: inset 0 0 0 2px var(--wb-green)`; empty days are plain.
- Legend: 11px ink 62%, an 11px brick dot ("N workouts") and an 11px green ring
  ("Today").

**Heatmap variant** (not shipped, spec'd for completeness): 12 week-columns × 7
day-cells of 16px, radius 5, `gap: 4px`; intensity
`rgba(156, 59, 52, .35 → 1)` scaled by set count; today ringed green; legend
swatches 13px.

**Stat tiles**: three, `flex: 1`, `padding: 12px 13px`, radius 20, `--wb-line`;
value Caprasimo 19 / 1, label 11px ink 55%.

**Session cards**: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 10px`; card `padding: 16px`, radius 26, `--wb-surf`, hairline shadow.
Header row: 8px routine dot, name Caprasimo 18, date 12px ink 50%. Metrics line:
duration and set count, 12px with the numbers in 700 full-ink. Then up to three
exercise lines, 13px, name at ink 75% / best at ink 62%, `gap: 5px`.

---

## 5. Live session

`mobile/12-session-fresh.png`, `13-session-in-progress.png` ·
`desktop/10-session-fresh.png`, `11-session-in-progress.png` ·
empty: `mobile/11-session-empty.png` · dark: `mobile/dark-05-session.png`

Full-height flex column, `z-index: 8`.

### Top bar

`--wb-inv` on `#f2ece1`, `padding: 14px 16px`, `gap: 12px`, non-scrolling.

| Element | Spec |
| --- | --- |
| Minimise | 34px circle, `rgba(247,242,232,.14)`, minus icon 18px stroke 2.2 |
| Title | session name, Caprasimo 17 / 1.1, ellipsis |
| Meta | `{elapsed} · {n} sets done`, 12px at 65%, `tabular-nums`, ticks every second |
| Finish | pill `padding: 9px 17px`, `--wb-brick`, 13/700 |

### Exercise card

`padding: 14px 14px 8px`, radius 26, `--wb-surf`, hairline shadow, cards
`gap: 14px`.

- Name Caprasimo 18 / 1.1; sub 11px ink 50% (`{muscle} · {equipment}`).
- Remove ✕: 30px circle hit area, icon 16px stroke 2, ink 40%.
- Column header: grid identical to the rows, 10px / 700 / uppercase /
  `letter-spacing: .06em`, ink 62%, `padding: 0 2px 6px`. Labels: `SET`,
  field 1 (e.g. `KG`), field 2 (`REPS`), `PREV`, and an empty cell for the tick.

### Set row — the most-used component in the app

Grid `38px 1fr 1fr 64px 48px` (two-field metrics) or `38px 1fr 64px 48px`
(single-field), `gap: 6px`, `padding: 3px 2px`, radius 18, `touch-action: pan-y`.

| Cell | Spec |
| --- | --- |
| Set label | 44px tall, radius 14, 13/800. Working set = ordinal on `rgba(ink,.07)`; warm-up = `W` on `--wb-green-tint` with `--wb-green-ink` text. Tap toggles warm-up ⇄ working |
| Value 1 / 2 | 44px tall, radius 14, **16/700, `tabular-nums`**, no fill of its own — it inherits the row background so the numbers sit flush. Tap opens the keypad on that field |
| Prev | 11px, ink 62%, centred — last session's matching set, or `—` |
| Tick | 48 × 44, radius 15, check icon 19px stroke 3. Idle: `rgba(ink,.07)` / ink 35%. Done: `--wb-green` / `#f1f7ee` |
| Row fill | done → `--wb-green-tint2`; not done → `--wb-surf` |

Behind each row, full-bleed `--wb-brick` with a 76px Delete panel on the right
(trash 15px stroke 2.75 + "Delete" 12/700, `#f2ece1`). Swipe mechanics in
`INTERACTIONS.md` — see `mobile/15-set-swipe-delete.png`.

**Add set**: `margin: 6px 0 8px`, `padding: 9px`, radius 14, `rgba(ink,.05)`,
13/700 at ink 55%. Clones the last set as a working set.

Below the cards: **Add exercise** dashed pill (`1.5px dashed rgba(ink,.28)`,
`padding: 15px`, radius 999, `--wb-accent-ink`, 14/700) and a quiet **Discard
workout** text button (13/700, ink 62%, `padding: 12px`).

### Empty session

`mobile/11-session-empty.png` — 58px `--wb-line` circle with a 26px dumbbell at
ink 40%, "No exercises yet" Caprasimo 20, 13px explainer at ink 55%
(`max-width: 230px`).

### Rest bar

`mobile/14-rest-timer.png` · `desktop/12-rest-timer.png`

Docked `left/right: 12px; bottom: 14px`, `padding: 12px 14px`, radius 24,
`--wb-inv`, `box-shadow: 0 12px 28px rgba(shad,.35)`, `animation: wbUp .22s`.
Countdown Caprasimo 24 `tabular-nums`; "REST" 11px / 700 / uppercase /
`letter-spacing: .08em` at 60%; progress track 5px tall, radius 3,
`rgba(247,242,232,.2)` with a `--wb-brick` fill at `restPct`; `+15s` pill on
`rgba(247,242,232,.14)`; `Skip` pill on `--wb-brick`. Both pills
`padding: 7px 12px`, 12/700.

When it fires, how long it runs, and what it skips are settings — see §11.

---

## 6. Numeric keypad

`mobile/16-keypad.png`, `17-keypad-typing.png`, `18-keypad-time.png` ·
`desktop/14-keypad.png` · dark: `mobile/dark-07-keypad.png`

Sheet on `rgba(shad,.42)`; panel `--wb-surf`, radius `30px 30px 0 0`,
`padding: 16px 16px 22px`, `box-shadow: 0 -8px 30px rgba(shad,.2)`,
`animation: wbUp .2s`.

| Element | Spec |
| --- | --- |
| Field label | e.g. "WEIGHT (KG)" — 11px / 700 / uppercase / `.1em`, `--wb-accent-ink` |
| Context | `{exercise} · set {n}`, 13px ink 60% |
| Readout | Caprasimo 34 / 1, `tabular-nums`, right-aligned. Shows the typed buffer, or the set's current value while the buffer is empty |
| Keys | 3 × 4 grid, `gap: 8px`, each 52px tall, radius 18, 21/700, `--wb-line`; `:active` `transform: scale(.96)` |
| Key 10 | `.` for decimals, or `00` when the field is a duration |
| Backspace | `rgba(ink,.06)` fill, ink 62%, 24px backspace icon (no label) |
| Done | `margin-top: 10px`, `padding: 15px`, radius 999, `--wb-brick`, Caprasimo 17 |

Time fields render the buffer as `m:ss` while typing (`18-keypad-time.png`).

---

## 7. Exercise picker

`mobile/19-picker.png`, `20-picker-selected.png`, `21-picker-search.png` ·
`desktop/16-picker.png`, `17-picker-selected.png` · dark: `mobile/dark-08-picker.png`

Sheet, `height: 82%`, `--wb-bg`, radius `30px 30px 0 0`, `animation: wbUp .22s`.

- Grabber 40 × 4, radius 2, `rgba(ink,.2)`, `margin: 0 auto 12px`.
- Heading Caprasimo 22 ("Add exercise" / "New exercise"), **Cancel** 13/700 at ink 50%.
- Search pill: `--wb-line`, `padding: 10px 14px`, 14px input.
- Two chip rows (muscle, equipment): `padding: 7px 14px`, radius 999, 12/700,
  edge-bleed `margin: 0 -16px; padding: 0 16px`.
- Rows: `padding: 12px 14px`, radius 20, `gap: 12px`; 22px checkbox radius 7 with
  `1.5px` border, tick 13px stroke 3.4 revealed by opacity; name 15/700, sub 12px
  ink 50%. Selected rows tint their background.
- Footer: `padding: 12px 16px 24px`, `--wb-bg`,
  `box-shadow: 0 -1px 0 rgba(ink,.08)`; CTA `padding: 15px`, radius 999,
  Caprasimo 17 — `--wb-brick` with "Add N exercises" when something is selected,
  `rgba(ink,.25)` with "Select exercises" when not.

### New-exercise card

`mobile/22-picker-new-exercise.png` · `desktop/18-picker-new-exercise.png`

Shown at the top of the list once the search text doesn't match an existing
exercise (or immediately in "New exercise" mode). Card `padding: 16px`, radius
24, `--wb-surf`, `gap: 12px`:

1. Eyebrow "NEW EXERCISE" + the typed name in Caprasimo 19 (placeholder "Name it
   above" at ink 45%).
2. **Body part** chips — `padding: 8px 14px`, radius 999, 12/700; idle
   `--wb-sand-tint`, selected `--wb-sel`.
3. **Equipment** chips — same, with icons.
4. **Measured by** — five radio rows, `padding: 11px 13px`, radius 18, 20px
   radio (1.5px ring, 12px tick), title 14/700, hint 11px. Selected row:
   `--wb-green-tint` fill, `inset 0 0 0 1.5px var(--wb-green)` ring, green ink.
   Options: Weight & reps · Distance & time · Reps & distance · Calories & time ·
   Time only.
5. CTA `padding: 14px`, radius 999, 14/700 — "Create and select", or "Enter a
   name" greyed at `rgba(ink,.25)`.

---

## 8. Exercise detail

`mobile/05-exercise-detail.png`, cardio variant `06-exercise-detail-cardio.png`,
empty `icons`-style state described below · `desktop/04-exercise-detail.png` ·
dark: `mobile/dark-04-exercise-detail.png`

Sticky header `padding: 14px 16px`: 36px `--wb-line` back circle (chevron 18px
stroke 2.2), name Caprasimo 20 / 1.1, sub 12px ink 55%, and a text unit toggle
(12/700, ink 50%).

Body `padding: 2px 16px 40px`, `gap: 14px`, `max-width: 820px`.

| Block | Spec |
| --- | --- |
| Best-set tile | `flex: 1`, `padding: 15px`, radius 24, `--wb-inv` / `#f2ece1`; label 10px uppercase `.1em` at 65%, value Caprasimo 24 / 1.1, date 11px at 60% |
| Secondary tile | same box on `--wb-green-tint`; content depends on measurement type (est. 1RM, best pace, total distance, cal·min⁻¹, total time) — formulas in `ANALYTICS.md` |
| Chart card | `padding: 17px`, radius 26, `--wb-surf`; title Caprasimo 17, trend 12/700 in `--wb-green-text`; bars `height: 112px`, `gap: 4px`, radius `6px 6px 3px 3px`, 10px value above each bar and a 10px date below |
| Logged sets | heading Caprasimo 19 + hint "tap a value to edit · swipe to delete" 11px ink 50% |
| — Session group | radius 20, `--wb-line`, `padding: 9px 11px`; date 13/700, routine name 11px ink 50% |
| — Set line | radius 13, `padding: 1px 8px 1px 0`, `gap: 6px`; index column 18px wide 11/800; value chips flush (`padding: 4px 3px`, radius 10, **14/800, `tabular-nums`**, `min-height: 28px`); separator `×` or `·` at 40%; e1RM note 11px ink 62% |

Both the chips and the swipe-to-delete behave exactly as in the live session —
this screen edits history in place.

**Empty state**: 56px `--wb-line` circle with the 25px chart glyph, "No sets
logged yet" Caprasimo 20, 13px explainer at ink 65% (`max-width: 240px`).

---

## 9. History detail

`mobile/08-history-detail.png` · `desktop/06-history-detail.png`

Read-only. Sticky header (back circle, routine name Caprasimo 20, meta 12px ink
55%). One card per exercise: radius 24, `--wb-surf`, `padding: 14px 15px`, title
row Caprasimo 17 with a 15px chevron at 35% (opens Exercise detail). Set lines:
`padding: 5px 0`, `border-top: 1px solid rgba(ink,.07)`, index 20px column
11/800, text 14px / 600 `tabular-nums`.

---

## 10. Routine editor

`mobile/09-routine-editor.png`, new: `10-routine-new.png` ·
`desktop/07-routine-editor.png`, `08-routine-new.png`

| Element | Spec |
| --- | --- |
| Header | back circle · heading Caprasimo 20 · **Save** 13/700 in `--wb-accent-ink` |
| Name field | full width, `padding: 13px 16px`, radius 999, `1px solid rgba(ink,.14)`, `--wb-surf`, 15/700; placeholder "e.g. Push A" |
| Count eyebrow | "N EXERCISES" 11px uppercase `.1em` ink 50% |
| Exercise row | `padding: 12px 14px`, radius 20, `--wb-surf`; index 22px column Caprasimo 15 at ink 60%, name 15/700, sub 12px ink 50%, remove ✕ 30px circle at ink 40% |
| Add exercises | dashed pill, `padding: 14px`, `--wb-accent-ink`, 14/700 → opens the picker |
| Start this workout | `padding: 16px`, radius 999, `--wb-brick`, Caprasimo 18 |
| Delete routine | text button 13/700 ink 62% (existing routines only) |

Saving with an empty name stores "New routine"; saving with zero exercises
discards instead of creating.

---

## 11. Settings

`mobile/25-settings.png`, `26-settings-timer-off.png`, `27-settings-imperial.png` ·
`desktop/21-settings.png`, `22-settings-timer-off.png` ·
dark: `mobile/dark-10-settings.png`

Opened from the gear in the Workout and Exercises headers, or the sidebar row on
desktop. Panel `z-index: 10`, `--wb-bg`, `animation: wbFade .18s`; sticky header
(38px back circle on `rgba(ink,.07)`, "Settings" Caprasimo 24); body
`padding: 6px 16px 44px`, `gap: 13px`, `max-width: 620px` centred.

Three cards, each `padding: 16px`, radius 26, `--wb-surf`, hairline shadow,
heading Caprasimo 18.

**Units** — two radio rows, `padding: 13px 14px`, radius 20, `gap: 12px`; 22px
radio with a 2px ring, filled `--wb-green` with a 12px tick when on (the tick is
`transparent` when off). Selected row sits on `--wb-green-tint`.
Metric = "kilograms · kilometres · metres", Imperial = "pounds · miles · yards".
Footnote 12px ink 50%: sets are stored in metric and converted for display, so
switching never rewrites history.

**Theme** — three equal pills (`Light` / `Dark` / `System`), `padding: 12px 6px`,
radius 999, 13/700; active `--wb-sel` / `--wb-sel-fg`, idle `rgba(ink,.06)` /
ink 62%. A 12px caption describes the active ground.

**Rest timer** —

| Control | Spec |
| --- | --- |
| Master switch | 46 × 27 track, radius 999, 3px padding, 21px knob `#fbf7ef` with `0 1px 2px rgba(43,38,28,.35)`; on = `--wb-green`, off = `rgba(ink,.2)`; knob `translateX(20px)`, `transition: .18s cubic-bezier(.2,.8,.2,1)` |
| Duration stepper | row `padding: 12px 14px`, radius 22, `rgba(ink,.05)`; 40px circular ± buttons on `--wb-surf` (17px glyphs, dimmed to `opacity: .3` at the 0:15 / 10:00 ends); value Caprasimo 30 `tabular-nums` with a 11px "DURATION" caption |
| Presets | five pills `0:45 · 1:00 · 1:30 · 2:00 · 3:00`, `padding: 8px 15px`, radius 999, 13/700 |
| Start it after | eyebrow + two pills: "Weights only" / "Every set" |
| Rest after warm-ups | label 14/700 + caption, right-aligned switch; off by default |

Turning the master switch off collapses everything below it
(`26-settings-timer-off.png`). Step is 15s, clamped to 0:15–10:00.

Footnote under the cards, 12px ink 45%: "Everything stays on this device — no
account, no sync."

All five values persist immediately (prototype: `wb.settings` +  `wb.theme`;
production: the `settings` store in `PERSISTENCE.md`).

---

## 12. Summary

`mobile/24-summary.png` · `desktop/20-summary.png` · dark: `mobile/dark-09-summary.png`

Full-bleed `--wb-inv` on `#f2ece1`, `padding: 34px 22px 28px`, `gap: 18px`.

- Eyebrow "WORKOUT COMPLETE" 11px / 700 / `.12em` in `#e0a79f`.
- Title Caprasimo 36 / 1.05, then "Finished 7:42 PM" 13px at 60%.
- Stat tiles: `flex: 1`, `padding: 14px`, radius 22, `rgba(247,242,232,.09)`;
  value Caprasimo 19, label 11px at 60% (duration, sets).
- **Personal records** card (only when there are any): `padding: 16px`, radius
  26, `--wb-green` on `#f1f7ee`; eyebrow at 85%, one row per PR — name 15/700
  left, value Caprasimo 18 right.
- Recap lines: `padding: 11px 0`, `border-bottom: 1px solid rgba(247,242,232,.12)`;
  "4 × Bench Press" 14px left, top set 13px at 65% `tabular-nums` right.
- **Done**: `padding: 16px`, radius 999, `--wb-brick`, Caprasimo 18.

---

## 13. Mini bar

`mobile/23-mini-bar.png` · `desktop/19-mini-bar.png`

Appears whenever a session is live and the user is not on the session screen.
Phone: `left/right: 12px`, `bottom: 84px` (labeled nav) — clears the nav; desktop:
`bottom: 18px`. `padding: 12px 14px`, radius 22, `--wb-inv`, float shadow, 9px
`--wb-brick` dot, session name 700, elapsed `tabular-nums`. Tap resumes.

On desktop the sidebar additionally shows an "IN PROGRESS" card
(`padding: 14px`, radius 20, `rgba(242,236,225,.09)`).

---

## 14. Navigation

**Phone — labeled bottom nav** (shipped): `--wb-line` bar,
`padding: 8px 8px 14px`, `box-shadow: 0 -1px 0 rgba(ink,.07)`. Each item is a
third of the width: a 22px icon inside a `padding: 4px 20px` pill (active pill
`--wb-sel`, icon `--wb-sel-fg`) over an 11/700 label. Order: History · Workout ·
Exercises.

**Desktop — sidebar**: 264px, `--wb-inv`, `padding: 26px 18px`, `gap: 22px`.
Logo tile 34px radius 12 `--wb-brick` + 19px dumbbell, wordmark Caprasimo 21.
"New workout" pill `padding: 14px`, radius 999, `--wb-brick`, 14/700. Nav rows
`padding: 12px 14px`, radius 16, 14/700 with 19px icons; the active row is
`--wb-brick`. Bottom group: in-progress card, **Settings** row, and an "Install
app" ghost pill (`inset 0 0 0 1.5px rgba(242,236,225,.3)`) shown only when the
browser fires `beforeinstallprompt`.

---

## 15. Cross-screen rules

- **Numbers** are always `font-variant-numeric: tabular-nums` — values, timers,
  dates, chart labels. Never let a running clock reflow.
- **Caprasimo is display only**: titles, card headings, stat values, big
  readouts, primary CTA labels. Never below 15px, never for a UI label or body
  copy.
- **No square corners anywhere.** Smallest radius in the app is 10px (value
  chips); buttons, inputs, chips and filters are all 999px.
- **One accent action per view.** `--wb-brick` marks the single primary action
  (Start, Finish, Done, Create); everything else is `--wb-sel`, `--wb-line`, or
  text.
- **Hit targets** are ≥ 44px on phone. Where a chip renders at 28px, its row
  padding makes up the difference.
- **Muscle tints** are decorative only — never the sole carrier of meaning.
- **Dark mode** flips every token (see `DESIGN_TOKENS.md`); no component hard-codes
  a hex except the four fixed values `#f2ece1`, `#f1f7ee`, `#fbf7ef` (knob), and
  `#e0a79f` (summary eyebrow), which sit on inverted surfaces in both themes.
