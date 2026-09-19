# Typography

Two faces, no exceptions.

| Role | Family | Weights used |
| --- | --- | --- |
| Display | **Caprasimo** | 400 (the only weight it has) |
| Interface | **Figtree** | 400, 500, 600, 700, 800 |

Both are open-licensed (SIL OFL) and available from Google Fonts.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**Self-host for production.** The app must render correctly offline on first
paint, and a Google Fonts round-trip breaks that. Download both families
(`google-webfonts-helper`, or `npm i @fontsource/figtree @fontsource/caprasimo`),
ship `woff2` next to the app, declare `@font-face` with `font-display: swap`,
and precache the files in the service worker (`PWA.md`). Subset to
`latin` + `latin-ext` unless you localise.

```css
body { font-family: Figtree, system-ui, -apple-system, "Segoe UI", sans-serif; }
/* display only */
.display { font-family: Caprasimo, Georgia, serif; }
```

Fallback note: Caprasimo is a heavy slab-ish display face; `Georgia, serif` is
the least-wrong fallback, but the swap is visible — precaching matters.

---

## Scale

Sizes are CSS px on the phone layout. Desktop uses the same ramp.

| Token | Face | Size / LH | Weight | Where |
| --- | --- | --- | --- | --- |
| Display XL | Caprasimo | 36 / 1.05 | 400 | Summary title |
| Display L | Caprasimo | 34 / 1 | 400 | Keypad readout |
| Display M | Caprasimo | 30 / 1 | 400 | Tab titles (Workout, Exercises, History), settings duration |
| Title L | Caprasimo | 24 / 1.1 | 400 | Settings heading, stat tile values, rest countdown |
| Title M | Caprasimo | 20–22 / 1.1 | 400 | Overlay titles, picker heading |
| Title S | Caprasimo | 17–19 / 1.15 | 400 | Card headings, exercise names, primary CTA labels |
| Value XS | Caprasimo | 15–16 / 1.1 | 400 | Badge initials, calendar month, list best-set |
| Body | Figtree | 15 / 1.45 | 400 | Paragraph copy |
| Body strong | Figtree | 15 | 700 | Row names, list titles |
| Value | Figtree | 16 | 700 | Set-row value cells (`tabular-nums`) |
| Value compact | Figtree | 14 | 800 | Logged-set chips, history detail (`tabular-nums`) |
| Label | Figtree | 13–14 | 700 | Buttons, chips, links |
| Meta | Figtree | 12–13 | 400–700 | Subtitles, captions — ink 50–65% |
| Micro | Figtree | 11 | 700 | Column headers, badges, legends |
| Eyebrow | Figtree | 10–11 | 700 | Uppercase, `letter-spacing: .08–.12em` |

Rules that matter:

- **Caprasimo never goes below 15px** and never labels a control other than a
  primary CTA. It is a voice, not a UI font.
- **Every number that can change** carries `font-variant-numeric: tabular-nums`:
  set values, timers, dates, chart labels, stat values, e1RM notes.
- Weight 800 is reserved for dense numeric chips; 700 is the normal emphasis.
- Body copy is never lighter than ink 55% on `--wb-surf`; captions bottom out at
  ink 45% and are never load-bearing.
- Line length in explanatory copy is capped at `max-width: 230–240px` on phone.
- `text-wrap: pretty` on any wrapped sentence of body copy.

---

## Uppercase usage

Only eyebrows and table column headers. Always with letter-spacing (`.06em` for
column headers, `.08–.12em` for eyebrows) and always 700. Never uppercase a
button label or a name.
