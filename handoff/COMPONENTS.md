# Components

Every recurring element, with the values it is drawn from. These are the
building blocks `UI_SPEC.md` composes — build them once.

Conventions: `ink(α)` = `rgba(var(--wb-ink-rgb), α)`; sizes are CSS px;
`/700` = font-weight. Radius 999 = pill.

---

## Buttons

| Variant | Where | Recipe |
| --- | --- | --- |
| **Primary CTA** | Done, Start this workout, Add N exercises, Finish summary | `padding: 15–16px`, radius 999, `--wb-brick`, `#f2ece1`, **Caprasimo 17–18**, `:active { transform: scale(.985) }` |
| **Primary compact** | Finish (session bar), Start (feed chip) | `padding: 9px 17px`, radius 999, `--wb-brick`, 13/700 |
| **Neutral fill** | Empty workout, Clear filters, New exercise | `padding: 13px`, radius 999, `--wb-sel` / `--wb-sel-fg`, 14/700 |
| **Quiet fill** | Add set | `padding: 9px`, radius 14, `ink(.05)`, 13/700 at ink 55% |
| **Dashed add** | Add exercise(s) | `padding: 14–15px`, radius 999, `1.5px dashed ink(.28)`, `--wb-accent-ink`, 14/700 |
| **Ghost on dark** | Install app | `padding: 12px`, radius 999, `box-shadow: inset 0 0 0 1.5px rgba(242,236,225,.3)`, 13/700 |
| **Text destructive** | Discard workout, Delete routine | 13/700, ink 62%, `padding: 10–12px`, centred — no red |
| **Disabled CTA** | Select exercises, Enter a name | same box, fill `ink(.25)`, `cursor: default` |

Circular icon buttons:

| Size | Use | Fill |
| --- | --- | --- |
| 30px | remove ✕ in lists, calendar stepper | transparent, glyph ink 40–62% |
| 34px | minimise (session bar) | `rgba(247,242,232,.14)` on dark |
| 36px | back chevron (overlays) | `--wb-line` |
| 38px | back chevron (settings), header gear (feed) | `ink(.07)` / hairline border |
| 40px | header gear, routine Start | `1px solid ink(.14)` / `--wb-brick` |
| 44px | create exercise | `--wb-brick` + `0 6px 16px rgba(accent,.24)` |
| 48px | new routine | `1px solid ink(.16)` |

---

## Chips

**Filter chip** — `padding: 6–7px 13–14px`, radius 999, 12/700.
Idle `--wb-line` / ink 60%; selected `--wb-sel` / `--wb-sel-fg`.
Equipment chips add a 13px icon and keep a `box-shadow` ring when selected.

**Form chip** (new-exercise body part / equipment) — `padding: 8px 14px`,
radius 999, 12/700; idle `--wb-sand-tint` / ink 65%; selected `--wb-sel`.

**Preset chip** (rest durations) — `padding: 8px 15px`, radius 999, 13/700,
`tabular-nums`; idle `ink(.06)` / ink 62%; selected `--wb-sel`.

**Segmented pair/triple** (theme, rest scope) — equal `flex: 1` pills,
`padding: 11–12px 6px`, radius 999, 13/700, `gap: 7px`, same on/off colours as
the preset chip.

Chip rows scroll horizontally and bleed to the gutter:
`display: flex; gap: 7px; overflow-x: auto; margin: 0 -18px; padding: 0 18px`
(`-16px/16px` inside sheets), scrollbar hidden via `.wbScroll`.

---

## Cards

| Card | Radius | Padding | Fill | Shadow |
| --- | --- | --- | --- | --- |
| Feature (routine, chart, session, settings group) | 26 | 14–17 | `--wb-surf` | `0 1px 2px rgba(shad,.1)` |
| List row (exercise, picker, routine editor) | 20–22 | 12–14 × 14–15 | `--wb-surf` | none |
| Stat tile | 20–24 | 12–15 | `--wb-line`, `--wb-inv`, or `--wb-green-tint` | none |
| Grouped set list (exercise detail) | 20 | 9 × 11 | `--wb-line` | none |
| Sheet | `30 30 0 0` | 14–16 | `--wb-bg` (picker) / `--wb-surf` (keypad) | `0 -8px 30px rgba(shad,.2)` |
| Dark panel (mini bar, rest bar) | 22–24 | 12 × 14 | `--wb-inv` | `0 12–14px 28–30px rgba(shad,.3–.35)` |

---

## Set row

The app's signature component. Two layers in one 18px-radius clipping box:

```
<div radius:18 overflow:hidden background:--wb-brick>      ← delete layer
  <div right:0 width:76 …>🗑 Delete</div>
  <div grid … transform:translateX(x) background:rowBg>    ← content layer
```

Content layer: `display: grid`, `grid-template-columns: 38px 1fr 1fr 64px 48px`
(or `38px 1fr 64px 48px`), `gap: 6px`, `padding: 3px 2px`, radius 18,
`touch-action: pan-y`, `transition: transform .2s cubic-bezier(.2,.8,.2,1)`
(none while dragging).

| Cell | Size | Type | States |
| --- | --- | --- | --- |
| Set label | 44 tall, radius 14 | 13/800 | working = ordinal on `ink(.07)`; warm-up = `W` on `--wb-green-tint`/`--wb-green-ink`. Tap toggles |
| Value | 44 tall, radius 14 | **16/700 tabular** | transparent fill; tap → keypad |
| Prev | — | 11px ink 62% | `—` when there is no prior set |
| Tick | 48 × 44, radius 15 | icon 19 stroke 3 | idle `ink(.07)`/ink 35%; done `--wb-green`/`#f1f7ee` |
| Row | | | done `--wb-green-tint2`; idle `--wb-surf` |

Compact variant (exercise detail history): radius 13, `padding: 1px 8px 1px 0`,
18px index column, value chips `padding: 4px 3px`, radius 10, **14/800 tabular**,
`min-height: 28px`, trailing e1RM note 11px ink 62%.

---

## Switch

46 × 27 track, radius 999, `padding: 3px`; knob 21px circle `#fbf7ef` with
`0 1px 2px rgba(43,38,28,.35)`. On: track `--wb-green`, knob
`translateX(20px)`. Off: track `ink(.2)`. Transitions: `background .18s ease`,
`transform .18s cubic-bezier(.2,.8,.2,1)`.

## Radio row

`padding: 11–13px 13–14px`, radius 18–20, `gap: 11–12px`. Dot 20–22px circle,
`1.5–2px` ring; selected = filled `--wb-green` with a 12px tick stroke 3.4, ring
`--wb-green`. Unselected shows **no tick** (`color: transparent`) and a ring at
`ink(.25–.28)`. Selected row fill `--wb-green-tint`; unselected `--wb-surf` or a
`1.5px` inset ring.

## Checkbox (picker)

22px, radius 7, `1.5px` border; tick 13px stroke 3.4 toggled with opacity so the
box never resizes.

## Stepper

Two flanking buttons around a value. Large form (settings): 40px circles on
`--wb-surf` with 17px glyphs, value Caprasimo 30. Inline form (quick log): 24 ×
28 hit areas, 13px glyphs at ink 40%, value 16/800 with `min-width: 52px`.
Out-of-range buttons drop to `opacity: .3`.

## Search field

Pill, `--wb-line`, `padding: 10px 14px`, `gap: 9px`; 16px search icon at 45%
opacity; `<input>` is transparent, borderless, `outline: none`, 14px, inherits
`--wb-ink`. Placeholder inherits browser default colour at ~45% — do not restyle
per-browser.

## Text input

`padding: 13px 16px`, radius 999, `1px solid ink(.14)`, `--wb-surf`, 15/700.

## Sheet

`position: absolute; inset: 0; z-index: 11–12; display: flex;
flex-direction: column; justify-content: flex-end;
background: rgba(var(--wb-shad-rgb), .42)`. The backdrop above the panel is a
flex spacer with an `onClick` to dismiss (`min-height: 60px` on the picker).
Panel: radius `30px 30px 0 0`, `animation: wbUp .2–.22s ease`. The picker is
`height: 82%`; the keypad is content-height.

## Empty state

Centred column, `gap: 9–10px`, `padding: 40–56px 24px`:
52–58px `--wb-line` circle with a 23–26px glyph at ink 40–50% · Caprasimo 18–20
headline · 13px body at ink 55–65%, `max-width: 230–240px` · optional pill row
(`padding: 11px 20px`, radius 999).

## Bar chart

Flex row, `align-items: flex-end`, `gap: 4–5px`, fixed height (112px detail,
64px home, 52px feed). Bars `flex: 1`, radius `6px 6px 3px 3px`, height as a
percentage; filled bars `--wb-brick`, dimmed `--wb-bar-dim`. Optional 10px value
label above and 10px date label below, both ink 62%. Y-floor is
`lo - (hi - lo) * .45` so week-to-week change is visible (`ANALYTICS.md`).

## Calendar cell

`aspect-ratio: 1`, `border-radius: 50%`, 12/700, 7-column grid `gap: 3px`.
Session day: `--wb-brick` / `--wb-sel-fg`. Today:
`box-shadow: inset 0 0 0 2px var(--wb-green)`. Non-interactive days keep
`cursor: default`.

## Heat cell

16px tall, radius 5, `gap: 4px`; `rgba(156,59,52,α)` with
`α = .35 + .65 × (sets / maxSets)`; empty `ink(.07)`; future `transparent`.

## Nav item (phone)

`flex: 1`, column, `gap: 4px`, `padding: 6px 0`; icon 22px inside a
`padding: 4px 20px` radius-999 pill (active `--wb-sel` + `--wb-sel-fg`); label
11/700 (active full ink, idle ink 50%).

## Nav row (desktop)

`padding: 12px 14px`, radius 16, `gap: 12px`, 14/700, icon 19px. Active
`--wb-brick` / `#f2ece1`; idle `rgba(242,236,225,.72)` with hover
`rgba(242,236,225,.08)`.

## Badge (muscle initial)

Square with a large radius: 34/12, 38/13, 42/15 (size/radius) — Caprasimo
14–17, background + ink from the muscle tint pair.

## Eyebrow

11px (10px on dark tiles) / 700 / uppercase, `letter-spacing: .08–.12em`.
Colour: ink 50–62%, or `--wb-accent-ink` / `--wb-green-ink` when the block is
accented.
