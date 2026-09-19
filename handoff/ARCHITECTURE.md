# Architecture

## Recommended stack

The user asked for a recommendation. This one is chosen for a single-user,
offline-first, install-to-homescreen app with no backend.

| Concern | Choice | Why |
| --- | --- | --- |
| Language | **TypeScript**, `strict: true` | The measurement-type system is the app's core complexity; discriminated unions catch the whole class of "wrong field for this exercise" bugs |
| UI | **React 19** | Matches the prototype's mental model; largest hiring pool |
| Build | **Vite 6** | Instant dev server, first-class PWA plugin |
| Routing | **React Router 7** (declarative, hash-free) | Overlays map to routes, so Android back works correctly |
| Data | **Dexie 4** + `dexie-react-hooks` | See `PERSISTENCE.md` |
| Ephemeral state | **Zustand** | The UI state (overlays, keypad target, swipe offsets) is small and doesn't belong in the DB |
| Styling | **CSS variables + CSS modules** | The prototype's theming is already token-based; CSS vars flip light/dark with zero JS re-render |
| Icons | **lucide-react**, `strokeWidth={2.75}` | The design system specifies Lucide at 2.75 |
| Tests | **Vitest** + **Testing Library** + **fake-indexeddb** | The analytics and persistence layers are pure logic and deserve real tests |
| Lint | ESLint + `@typescript-eslint` strict, Prettier | — |

Deliberately **not** used: Next.js (no server, no SSR value — an offline app
wants a static shell), React Native (the user is shipping a PWA; a native shell
can wrap this later via Capacitor if it ever needs Health integration), a CSS
framework (the token set is bespoke and small), a data-fetching library (there is
nothing to fetch).

## Folder layout

```
src/
  domain/                  # pure, dependency-free
    types.ts               # ← DATA_MODEL.ts goes here verbatim
    metrics.ts             # ← metrics.ts goes here verbatim
    analytics.ts           # bestSet, prs, chart, streaks (per ANALYTICS.md)
    session.ts             # live-session reducers: addSet, toggleDone, finish…
  data/
    db.ts                  # Dexie schema + migrations
    repo.ts                # the only module that touches db
    seed.ts                # first-run seeding; dev-only demo generator
    backup.ts              # export / import JSON
  store/
    ui.ts                  # Zustand: tab, overlay stack, keypad, swipe, search
    live.ts                # live session: reads db, writes debounced
    settings.ts            # unit / theme / logStyle, hydrated from db
  theme/
    tokens.css             # ← DESIGN_TOKENS.md, light + [data-theme="dark"]
    base.css               # resets, fonts, .scroll utility, keyframes
  components/              # presentational, token-styled, no db access
    Pill.tsx  StatTile.tsx  SetRow.tsx  SwipeRow.tsx  Keypad.tsx
    Sheet.tsx  Overlay.tsx  BarChart.tsx  Calendar.tsx  EmptyState.tsx
  screens/
    WorkoutTab.tsx  ExercisesTab.tsx  HistoryTab.tsx
    LiveSession.tsx  ExerciseDetail.tsx  SessionDetail.tsx
    RoutineEditor.tsx  Summary.tsx  Settings.tsx
  app/
    App.tsx  routes.tsx  Nav.tsx  MiniBar.tsx  ThemeProvider.tsx
  main.tsx
public/
  icons/  fonts/  manifest.webmanifest
```

## Module boundaries (the rules that keep this clean)

1. `domain/` imports nothing from `data/`, `store/`, or React. Pure functions
   over plain data. All of `ANALYTICS.md` lives here and is unit-tested without
   a DOM.
2. Only `data/repo.ts` touches `data/db.ts`. Screens never import Dexie.
3. `components/` are presentational: props in, callbacks out, no repo, no store.
4. `screens/` wire store + repo to components. This is the only layer allowed to
   know both.
5. Canonical units never leave `domain/metrics.ts` unconverted — components
   receive display strings or call the formatters, never do their own math.

## Routing ↔ overlays

Map every overlay to a real route so the hardware/browser back button does the
obvious thing (the #1 complaint about modal-stacked PWAs):

```
/                          → Workout tab
/exercises                 → Exercises tab
/history                   → History tab
/session                   → Live session        (guarded: redirect if none)
/session/summary/:id       → Summary
/exercise/:id              → Exercise detail
/history/:id               → Session detail
/routine/:id  /routine/new → Routine editor
/settings                  → Settings
```

The keypad and exercise-picker **sheets** stay non-routed local state (they're
transient sub-interactions of the screen beneath, and routing them makes back
feel broken). Everything else is a route.

## Live-session data flow

```
user taps a value cell
  → ui.store: open keypad { entryId, setId, field }
  → user types, taps Done
  → live.store.patchSet(entryId, setId, s => withUserInput(s, field, typed, unit))
      · updates in-memory LiveSession immediately (optimistic, zero latency)
      · schedules debounced repo.putLive() (250ms trailing)
  → useLiveQuery-driven screens re-render from the store, not from the DB
```

The live session is the one place where the **store is the source of truth** and
the DB is a write-behind cache. Everything else (history, exercises, routines)
reads from the DB through `useLiveQuery`. Keep that asymmetry explicit — it's
what makes set logging feel instant while still surviving a kill.

## Gestures

Swipe-to-delete must not re-render per pointer event beyond what's needed:

- Keep gesture bookkeeping (pointer id, origin x, base offset, `moved`,
  `endedAt`) in a **ref or module-level object**, not React state — the
  prototype learned this the hard way.
- Only the visual offset goes through state (or better: write
  `transform` directly to the node via ref during the drag, and commit the
  latched state on release).
- Pointer Events + `setPointerCapture`, `touch-action: pan-y` on the row.
- 250ms post-drag tap guard so releasing doesn't fire the cell's click.
- Thresholds: clamp `-92px`, latch at `-76px`, trigger latch when released past
  `-38px`.
- Provide a non-gesture path to the same action (long-press menu or an overflow
  ✕ in edit mode) — swipe-only destructive actions are inaccessible.

## Accessibility (the logging screen especially)

- Every value cell is a `<button>` announcing "Weight, 82.5 kilograms, edit".
- The done checkbox is a real `<input type="checkbox">` with a visible
  `:focus-visible` ring.
- Set rows are a `<table>` semantically in `rows` mode (header row = field
  headers) or a list in `focus` mode.
- Rest timer changes announce via a polite `aria-live` region, not per second —
  announce at start, 30s, 10s, done.
- Respect `prefers-reduced-motion`: overlays fade only, sheets skip the
  translate, rows snap instead of easing.
- Target contrast 4.5:1 for body text; the design system notes the
  accent-on-ground pair is only 3:1, so accent text at paragraph size must use
  the deep ramp step (`--wb-accent-ink`, not `--wb-brick`).

## Leaving the door open for sync

Cloud is out of scope, but these three cheap decisions avoid a rewrite later:

1. **`repo` is an interface.** A future `SyncRepo` wraps the local one.
2. **Every record carries `updatedAt`** (and sessions a stable `id` generated
   client-side — use `crypto.randomUUID()`, not `'s' + Date.now()` as the
   prototype does; timestamps collide and don't survive merging).
3. **Never reuse ids across devices.** Built-in exercises keep their stable
   string ids (they're the same everywhere); user-created rows get UUIDs.

Add a `deletedAt` soft-delete column if sync ever lands — don't bother now.

## Milestones

1. **Skeleton + data layer** — types, Dexie, repo, seeding, settings, theming.
   Ship the three tabs with real data and empty states.
2. **The logging loop** — live session, set rows, keypad, swipe-delete, rest
   timer, finish → summary. Persisted live session. *This is the app; get it
   right before anything else.*
3. **Analytics** — exercise detail (best set, secondary tile, chart, editable
   logged sets), history detail, streaks.
4. **Library & routines** — exercise search/filter, custom exercises, routine
   editor.
5. **PWA hardening** — manifest, SW, self-hosted fonts, install flow, safe
   areas, export/import.
6. **Polish** — reduced motion, a11y pass, wake lock, dev demo-data toggle.
