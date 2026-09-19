import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { seedIfEmpty } from '../data/seed';
import { useSettingsStore } from '../store/settings';
import { useLiveStore, flushLiveWrite } from '../store/live';
import { Shell } from './Shell';
import { UpdatePrompt } from './UpdatePrompt';
import { WorkoutTab } from '../screens/WorkoutTab';
import { ExercisesTab } from '../screens/ExercisesTab';
import { HistoryTab } from '../screens/HistoryTab';
import { LiveSessionScreen } from '../screens/LiveSession';
import { ExerciseDetail } from '../screens/ExerciseDetail';
import { SessionDetail } from '../screens/SessionDetail';
import { RoutineEditor } from '../screens/RoutineEditor';
import { Summary } from '../screens/Summary';
import { SettingsScreen } from '../screens/Settings';

const THEME_COLOR = { light: '#9c3b34', dark: '#23241d' } as const;

export function App() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLive = useLiveStore((s) => s.hydrate);
  const liveLoaded = useLiveStore((s) => s.loaded);
  const startTick = useLiveStore((s) => s.startTick);
  const startEmpty = useLiveStore((s) => s.startEmpty);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      await seedIfEmpty();
      await Promise.all([hydrateSettings(), hydrateLive()]);
    })();
  }, [hydrateSettings, hydrateLive]);

  useEffect(() => startTick(), [startTick]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const apply = () => {
      const effective = settings.theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;
      meta.setAttribute('content', THEME_COLOR[effective]);
    };
    apply();
    if (settings.theme !== 'auto') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [settings.theme]);

  useEffect(() => {
    const flush = () => flushLiveWrite(useLiveStore.getState().live);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  useEffect(() => {
    if (!settingsLoaded || !liveLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tab = params.get('tab');
    if (action === 'start-empty' && !useLiveStore.getState().live) {
      startEmpty();
      navigate('/session', { replace: true });
    } else if (tab === 'history') {
      navigate('/history', { replace: true });
    }
    if (action || tab) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded, liveLoaded]);

  if (!settingsLoaded || !liveLoaded) return null;

  return (
    <>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<WorkoutTab />} />
          <Route path="/exercises" element={<ExercisesTab />} />
          <Route path="/history" element={<HistoryTab />} />
        </Route>
        <Route path="/session" element={<LiveSessionScreen />} />
        <Route path="/session/summary/:id" element={<Summary />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/history/:id" element={<SessionDetail />} />
        <Route path="/routine/new" element={<RoutineEditor />} />
        <Route path="/routine/:id" element={<RoutineEditor />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdatePrompt />
    </>
  );
}
