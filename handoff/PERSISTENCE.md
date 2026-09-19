# Persistence — on-device, offline-first

**Decision: IndexedDB via [Dexie](https://dexie.org), one database, no server.**

Why not the alternatives:

- `localStorage` — synchronous, ~5MB, string-only. Fine for a theme flag (the
  prototype uses it for exactly that), wrong for a growing set log.
- OPFS / SQLite-wasm — more power than this needs and a much larger bundle.
- Supabase/cloud — explicitly out of scope; the user chose on-device only.

Dexie gives typed tables, compound indexes, transactions, and a clean migration
path, in ~25 kB gzipped.

## Database

```ts
// src/data/db.ts
import Dexie, { type Table } from 'dexie';
import type {
  Exercise, Routine, Session, LiveSession, Settings,
} from '../domain/types';

export class WorkbookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  sessions!: Table<Session, string>;
  live!: Table<LiveSession, string>;      // 0 or 1 row, id = 'current'
  settings!: Table<Settings, string>;     // 1 row, id = 'settings'

  constructor() {
    super('workbook');
    this.version(1).stores({
      exercises: 'id, muscle, measurement, custom, name',
      routines:  'id, name, updatedAt',
      sessions:  'id, performedAt, routineId, *exerciseIds',
      live:      'id',
      settings:  'id',
    });
  }
}

export const db = new WorkbookDB();
```

### Why `*exerciseIds` on sessions

The exercise-detail screen asks "every session containing exercise X". Without
an index that is a full scan of all sessions. Maintain a denormalized
`exerciseIds: string[]` on every `Session` row (derived on write, never edited by
hand) and Dexie's multi-entry index answers it directly:

```ts
db.sessions.where('exerciseIds').equals(exerciseId).reverse().sortBy('performedAt')
```

Add `exerciseIds` to the `Session` interface in `DATA_MODEL.ts` when you wire
this up — it is storage bookkeeping, so keep it out of the domain logic's way.

## Seeding

On first run only (detect via an empty `settings` table, inside one
transaction):

1. Insert `BUILTIN_EXERCISES` with `custom: false`.
2. Insert `BUILTIN_ROUTINES` with `createdAt = updatedAt = Date.now()`.
3. Insert `DEFAULT_SETTINGS`.
4. Insert **no** sessions.

The prototype ships six weeks of fabricated history (`buildHistory()`). **Do not
ship that.** A real user's first launch must be empty, with the empty states
designed in the prototype doing their job. Keep the generator as a dev-only
fixture behind `import.meta.env.DEV` so the charts and history screens can be
worked on — a "Load demo data" / "Reset" pair in a dev-only settings section is
the cheapest way to keep it useful.

## Repository layer

Put every Dexie call behind a repository module. Nothing in `components/` or the
store touches `db` directly. This is what makes the cloud tier addable later
without touching the UI.

```ts
// src/data/repo.ts — the complete surface the app needs
export const repo = {
  // exercises
  listExercises(): Promise<Exercise[]>,
  createExercise(draft: Omit<Exercise,'id'|'custom'>): Promise<Exercise>,
  archiveExercise(id: ExerciseId): Promise<void>,   // soft delete

  // routines
  listRoutines(): Promise<Routine[]>,
  saveRoutine(r: Routine): Promise<void>,
  deleteRoutine(id: RoutineId): Promise<void>,

  // history
  listSessions(limit?: number): Promise<Session[]>,          // performedAt desc
  sessionsForExercise(id: ExerciseId): Promise<Session[]>,   // performedAt desc
  getSession(id: SessionId): Promise<Session | undefined>,
  updateSession(id: SessionId, mutate: (s: Session) => void): Promise<void>,
  deleteSession(id: SessionId): Promise<void>,

  // live session (single row)
  getLive(): Promise<LiveSession | undefined>,
  putLive(s: LiveSession): Promise<void>,
  clearLive(): Promise<void>,
  finishLive(): Promise<{ session: Session; prs: PersonalRecord[] } | null>,

  // settings
  getSettings(): Promise<Settings>,
  patchSettings(p: Partial<Settings>): Promise<Settings>,

  // maintenance
  exportAll(): Promise<Blob>,          // JSON, see Export/Import
  importAll(file: File): Promise<void>,
  wipe(): Promise<void>,
};
```

`updateSession` is what powers **editing a logged set from the exercise detail
screen** (a real feature in the prototype). It must run in a transaction, keep
`exerciseIds` in sync, bump `updatedAt`, and delete the entry when its last set
goes — and delete the session when its last entry goes.

## The live session is persisted

This is the requirement that matters most in a gym: phone locks, browser evicts
the tab, user reloads — the workout must still be there.

- Write the live session to `db.live` (id `'current'`) on **every mutation**,
  debounced ~250ms (trailing) with a forced flush on `visibilitychange` →
  `hidden` and on `pagehide`.
- On boot, read `db.live`; if present, restore it and show the resume card /
  mini bar.
- `finishLive()` is one transaction: build the `Session` (dropping undone sets
  and emptied entries), compute PRs **against pre-insert history**, `put` the
  session, `delete` the live row.
- If `entries` ends up empty, clear the live row and store nothing.

## Reactive reads

Use `dexie-react-hooks`:

```ts
const sessions = useLiveQuery(() => repo.listSessions(50), [], undefined);
```

`useLiveQuery` re-runs on any write to the touched tables, so an edit in the
exercise detail screen updates history and charts with no manual invalidation.
Distinguish `undefined` (still loading — render skeletons matching the
prototype's placeholder counts: 3–4 cards) from `[]` (genuinely empty — render
the designed empty state).

## Storage durability

```ts
// Ask once, after the first completed session (not on first load — a cold
// prompt with nothing to lose gets denied).
if (navigator.storage?.persist) await navigator.storage.persist();
```

Also surface `navigator.storage.estimate()` in settings once usage is
meaningful. Realistic budget: a set row is ~80 bytes of JSON; a heavy user logs
~5,000 sets a year — under 1 MB annually. Storage pressure is not a real concern;
**eviction without `persist()`** is.

## Export / import

Non-negotiable for a local-only app — it is the user's only backup.

- **Export**: a single JSON file, `workbook-YYYY-MM-DD.json`, containing
  `{ version: 1, exportedAt, exercises, routines, sessions, settings }`.
  Download via a Blob URL.
- **Import**: validate `version`, then replace-or-merge inside one transaction.
  Merge rule: by `id`, incoming wins on conflict for sessions; for exercises,
  keep local custom exercises and add unknown ones.
- Put both in Settings, alongside a destructive "Delete all data" with a typed
  confirmation.

## Migrations

Every schema change adds a `version(n)` block — never edit an existing one.

```ts
this.version(2)
  .stores({ sessions: 'id, performedAt, routineId, *exerciseIds, mood' })
  .upgrade(tx => tx.table('sessions').toCollection().modify(s => { s.mood ??= null; }));
```

Rules:

- Additive changes only where possible; unit-of-storage changes are forbidden
  (canonical units are the contract — see `DATA_MODEL.ts`).
- Write a migration test for each version bump: seed a v(n-1) database fixture,
  open at v(n), assert shape.
- Bump the export `version` alongside, and make `importAll` accept older export
  versions.

## Failure modes to handle explicitly

| Situation | Behavior |
| --- | --- |
| IndexedDB unavailable (private mode, locked-down browser) | Run in memory, show a persistent "Data won't be saved" banner. Never white-screen. |
| Write fails mid-session | Keep the in-memory session, toast once, retry on next mutation. Losing a set the user just logged is the worst outcome in the app. |
| `QuotaExceededError` | Prompt to export + prune old sessions. |
| Two tabs open | Dexie's `BroadcastChannel`-backed liveQuery keeps reads in sync; guard the live session with a `lastWriteAt` check so the older tab doesn't clobber the newer. |
| Clock changed / timezone travel | Store epoch ms only; derive all day/week keys in local time at render time. |
