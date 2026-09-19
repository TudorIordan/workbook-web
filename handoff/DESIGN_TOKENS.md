# Design tokens

The prototype declares a light palette as inline CSS-variable **fallbacks** and
swaps to dark by setting the same variables on `document.documentElement`. In the
real app, declare both sets in `theme/tokens.css` and switch with a
`[data-theme="dark"]` attribute on `<html>` — no JS style writing.

```css
:root {
  /* ground & ink */
  --wb-bg:          #f2ece1;   /* page background */
  --wb-ink:         #23241d;   /* primary text */
  --wb-ink-rgb:     35, 36, 29;/* for rgba(var(--wb-ink-rgb), a) */
  --wb-surf:        #fbf7ef;   /* cards, inputs, raised rows */
  --wb-line:        #e6dcc9;   /* dividers, chips, nav bar, group cards */
  --wb-inv:         #23241d;   /* inverted surfaces: sidebar, summary, mini bar */
  --wb-frame:       #d9cfbb;   /* desk background behind the device frame */

  /* selected / filled controls */
  --wb-sel:         #23241d;
  --wb-sel-fg:      #f2ece1;

  /* brick (primary accent) */
  --wb-brick:       #9c3b34;
  --wb-brick-hover: #82302a;
  --wb-brick-deep:  #6e2620;
  --wb-accent-ink:  #6e2620;   /* accent TEXT — use this, not --wb-brick */
  --wb-accent-rgb:  110, 38, 32;

  /* green (success / done / warm-up) */
  --wb-green:       #3d6b43;
  --wb-green-ink:   #2a4d2f;
  --wb-green-text:  #3d6b43;
  --wb-green-tint:  #dfeadb;
  --wb-green-tint2: #e5efe1;   /* completed set row */

  /* muscle-group tints */
  --wb-rose-tint:   #f6dcd6;
  --wb-sand-tint:   #ece5d8;
  --wb-sand-ink:    #5b5a48;

  /* misc */
  --wb-bar-dim:     #d8cdb8;   /* unfilled chart bar */
  --wb-shad-rgb:    43, 38, 28;
}

[data-theme="dark"] {
  --wb-bg:          #23241d;
  --wb-ink:         #f2ece1;
  --wb-ink-rgb:     247, 242, 232;
  --wb-surf:        #2c2d24;
  --wb-line:        #3a3b30;
  --wb-inv:         #34352b;
  --wb-frame:       #14150f;

  --wb-sel:         #f2ece1;
  --wb-sel-fg:      #23241d;

  --wb-brick:       #a8443c;
  --wb-brick-hover: #bc4f46;
  --wb-brick-deep:  #8d362e;
  --wb-accent-ink:  #e0a79f;
  --wb-accent-rgb:  224, 167, 159;

  --wb-green:       #467a4d;
  --wb-green-ink:   #a9cba3;
  --wb-green-text:  #a9cba3;
  --wb-green-tint:  #2b3a2c;
  --wb-green-tint2: #283322;

  --wb-rose-tint:   #3b2a27;
  --wb-sand-tint:   #34342a;
  --wb-sand-ink:    #d3cdb8;

  --wb-bar-dim:     #4b4c3e;
  --wb-shad-rgb:    0, 0, 0;
}
```

Note the inversions: `--wb-sel` / `--wb-sel-fg` swap, and `--wb-accent-ink`
becomes a **light** rose in dark mode. Any component that hardcodes a hex will
break in one theme — always go through the variables.

## Relationship to the Organic design system

Workbook's palette is a **warmer, higher-contrast derivation** of the bound
Organic system (`design-system/styles.css`), tuned for a gym app that gets used
at arm's length under bad lighting:

| Organic | Workbook | Note |
| --- | --- | --- |
| `--color-bg` `#f5ead8` | `--wb-bg` `#f2ece1` | Slightly cooler cream |
| `--color-text` `#201e1d` | `--wb-ink` `#23241d` | Same ink family |
| `--color-accent` `#c67139` (terracotta) | `--wb-brick` `#9c3b34` | Pushed redder/deeper for the primary action |
| `--color-accent-2` `#7a8a5e` (sage) | `--wb-green` `#3d6b43` | Darkened so "done" reads at a glance |

Inherit from Organic **unchanged**: Caprasimo + Figtree, the 16px→999px radius
language, the 2.75 Lucide stroke, pill buttons, over-rounded containers, the
`:focus-visible` accent ring, and the "no sharp corners, no greys" rules. Where
Organic and this token sheet disagree on a hex, the token sheet wins — it is
what the prototype was approved in.

## Type

| Role | Font | Size / line-height / weight |
| --- | --- | --- |
| Screen title | Caprasimo | 26px / 1.1 / 400 |
| Section heading | Caprasimo | 19–21px / 1.1 / 400 |
| Card title | Caprasimo | 17px / 1.15 / 400 |
| Stat value | Caprasimo | 24px / 1.1 / 400 |
| Body | Figtree | 15px / 1.45 / 400 |
| Body strong / row name | Figtree | 15px / 700 |
| Value cell | Figtree | 14px / 800, `tabular-nums` |
| Label / meta | Figtree | 12–13px / 400–700, `rgba(ink, .5–.65)` |
| Micro label | Figtree | 11px / 700 |
| Eyebrow | Figtree | 10–11px / 700, `letter-spacing: .1em`, uppercase |

Caprasimo is **display only** — never below 17px, never for UI labels. Figtree
carries every interface string. No third face.

## Spacing

Prototype values, normalized to a scale — use these, don't invent between them:

```
2  3  4  5  6  7  8  9  10  11  12  14  16  18  20  22  26  32  34
```

Practical defaults: screen gutter `18px` (phone) / `18–26px` (desktop sidebar),
card padding `13–17px`, card gap `10–11px`, section gap `14–18px`, bottom scroll
padding `118px` (clears the nav), row gap `5–8px`.

## Radii

```
--r-sm:  10px   /* value chips */
--r-md:  13px   /* set rows */
--r-lg:  16px   /* nav items, inline blocks */
--r-xl:  20px   /* grouped cards, list rows */
--r-2xl: 24px   /* stat tiles, session cards */
--r-3xl: 26px   /* feature cards (chart, routine) */
--r-pill: 999px /* every button, input, chip, filter */
```

Nothing in this app has square corners. Circles for avatars/FAB/back buttons
(`border-radius: 50%`, 36px back button, 66px FAB).

## Shadows

```
--sh-hairline: 0 1px 2px  rgba(var(--wb-shad-rgb), .1);   /* cards */
--sh-raised:   0 10px 22px rgba(var(--wb-accent-rgb), .35); /* FAB */
--sh-float:    0 14px 30px rgba(var(--wb-shad-rgb), .3);  /* floating nav, mini bar */
--sh-inset-ring: inset 0 0 0 1.5px rgba(242, 236, 225, .3); /* ghost on dark */
```

Borders are `1px solid rgba(var(--wb-ink-rgb), .07–.14)` for hairlines and
`1.5px dashed rgba(var(--wb-ink-rgb), .28)` for "add" affordances.

## Motion

```
--ease-out:  cubic-bezier(.2, .8, .2, 1);
--dur-fade:  160ms;   /* overlay fade in */
--dur-sheet: 180ms;   /* bottom sheet translateY(110%) → 0 */
--dur-row:   200ms;   /* swipe row settle, --ease-out */
--dur-summary: 200ms;
```

Keyframes carried over from the prototype:

```css
@keyframes wbUp   { from { transform: translateY(110%); } to { transform: translateY(0); } }
@keyframes wbFade { from { opacity: 0; } to { opacity: 1; } }
```

## Muscle-group tints

Used by the exercise-row initial badge and detail headers — `[background, ink]`:

| Group | Background | Ink |
| --- | --- | --- |
| Chest, Shoulders | `--wb-rose-tint` | `--wb-accent-ink` |
| Back, Arms | `--wb-green-tint` | `--wb-green-ink` |
| Legs, Core | `--wb-sand-tint` | `--wb-sand-ink` |

(Unknown group → the sand pair.)

## Opacity conventions

`rgba(var(--wb-ink-rgb), α)` with α at:
`.07` hairline/unselected chip fill · `.12` empty progress pip ·
`.14` input border · `.28` dashed border · `.3–.35` inactive glyph ·
`.4` separator · `.5–.55` secondary text · `.62–.65` tertiary text.

Disabled controls: `opacity: .45` (Organic's rule). Inactive nav arrows use
`opacity: .3`.

## Layout constants

```
breakpoint:        900px
sidebar width:     264px
content max-width: 980px (screens) / 820px (forms)
bottom nav height: ~74px + safe-area
scroll bottom pad: 118px
back button:       36px circle
FAB:               66px circle, 5px --wb-bg border
swipe delete panel: 76px wide
```
