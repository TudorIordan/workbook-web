# PWA hardening

The prototype registers a hand-written `sw.js` and links a minimal
`manifest.json`. Both are stubs. Replace them with a generated, versioned
service worker.

**Decision: `vite-plugin-pwa` in `generateSW` mode (Workbox under the hood).**
Hand-rolled service workers are where offline apps go to die — stale caches, no
precache manifest, no update story.

## Why offline is a hard requirement here

Gyms have no signal. The app must launch, log a full workout, and finish it with
the radio off, on second launch, after an update. That means: precache the whole
app shell, self-host every font, and never let a network request block the UI.
There is no API to be offline *from* — all data is local — so full offline is
achievable, not approximated.

## Manifest

```json
{
  "name": "Workbook",
  "short_name": "Workbook",
  "description": "Log your lifts. Watch them move.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "orientation": "portrait",
  "background_color": "#f2ece1",
  "theme_color": "#9c3b34",
  "categories": ["health", "fitness", "lifestyle"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Start empty workout", "url": "/?action=start-empty" },
    { "name": "History", "url": "/?tab=history" }
  ]
}
```

- Icons are in `prototype/icons/` — reuse them. Verify the maskable one keeps
  its mark inside the safe circle (80% inset).
- `theme_color` must flip with the theme at runtime: update
  `<meta name="theme-color">` to `#9c3b34` (light) / `#23241d` (dark), as the
  prototype does in `applyTheme()`.
- Add `apple-touch-icon` and `apple-mobile-web-app-*` meta for iOS standalone
  (already present in the prototype's `<head>` — keep them).

## Service worker

```ts
// vite.config.ts
VitePWA({
  registerType: 'prompt',          // never silently swap code mid-workout
  includeAssets: ['icons/*.png', 'fonts/*.woff2'],
  manifest: { /* as above */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    clientsClaim: false,           // pairs with registerType: 'prompt'
    runtimeCaching: [],            // nothing external at runtime — keep it empty
  },
})
```

Key choices:

- **`registerType: 'prompt'`** — an auto-updating SW that reloads while a user
  is mid-set is a bug, not a feature. Show a small "Update ready" pill (style it
  like the mini bar: `--wb-inv`, 22px radius) and apply on tap. Suppress the
  prompt entirely while a live session exists; re-offer on the summary screen.
- **Precache everything** — the app is small and fully local. No runtime
  caching rules means no cache-strategy bugs.
- **Never precache the Google Fonts CDN.** Self-host instead (next section).

## Fonts

Self-host **Caprasimo** (400) and **Figtree** (400/500/600/700/800) as `woff2`
in `public/fonts/`, declared with `font-display: swap` and precached. Reasons:
the CDN is a network dependency the app cannot satisfy offline, and the
`<link>`-to-Google flow in the prototype causes a visible flash of fallback type
on cold start.

```css
@font-face {
  font-family: 'Caprasimo';
  src: url('/fonts/caprasimo-400.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
/* …one block per Figtree weight actually used… */
```

Subset to `latin` + the glyphs the UI needs (`×`, `·`, `—`). Drop any Figtree
weight the final build doesn't reference.

## Install flow

The prototype already models this: listen for `beforeinstallprompt`, stash the
event, reveal an "Install app" pill, call `prompt()` on tap.

```ts
let deferred: BeforeInstallPromptEvent | null = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; setCanInstall(true); });
// on tap: await deferred?.prompt(); deferred = null; setCanInstall(false);
```

- Hide the pill when `matchMedia('(display-mode: standalone)').matches`.
- iOS/Safari fires nothing — detect iOS + non-standalone and show a one-time
  "Add to Home Screen" hint sheet with the Share-icon instruction instead.
- Don't nag: surface the install affordance in the sidebar/settings, and once
  on the summary screen after a completed workout — never as a startup modal.

## Standalone-mode layout

Under `display: standalone` the app owns the full screen, so:

- Respect safe areas: `viewport-fit=cover` in the viewport meta, then
  `padding-bottom: max(14px, env(safe-area-inset-bottom))` on the bottom nav and
  `padding-top: env(safe-area-inset-top)` on sticky headers.
- `overscroll-behavior: none` on the scroll containers to kill pull-to-refresh
  (a reload mid-workout looks like data loss even when it isn't).
- `touch-action: pan-y` on swipeable set rows (the prototype already does this) —
  without it, horizontal swipes fight the browser's back gesture.
- `user-select: none` on controls; keep it enabled on notes/names.
- Optional but nice in a gym: a **Keep screen awake** toggle in settings using
  the Screen Wake Lock API, acquired while a live session exists and released on
  finish.

## Lighthouse / acceptance checklist

- [ ] Installable: manifest valid, icons present, SW registered, HTTPS.
- [ ] Works offline from a cold start with the network disabled.
- [ ] Second launch offline after a deploy still boots (precache versioning).
- [ ] No layout shift when fonts load (self-hosted + `swap` + matched metrics).
- [ ] `theme-color` matches the active theme.
- [ ] A full workout can be logged and finished with the radio off.
- [ ] Killing the app mid-workout and relaunching restores the live session.
- [ ] Performance: first contentful paint < 1.5s on a mid-tier Android over
      the precache.

## Explicitly out of scope

Push notifications, background sync, and periodic background sync. Rest-timer
alerts should use in-page audio + `navigator.vibrate()` while the app is open,
not push — push requires a server, and there isn't one.
