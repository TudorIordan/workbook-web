import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { seedIfEmpty } from '../data/seed';
import { useSettingsStore } from '../store/settings';
import { useLiveStore, flushLiveWrite } from '../store/live';
import { Shell } from './Shell';
import { WorkoutTab } from '../screens/WorkoutTab';
import { ExercisesTab } from '../screens/ExercisesTab';
import { HistoryTab } from '../screens/HistoryTab';
import { LiveSessionScreen } from '../screens/LiveSession';
import { ExerciseDetail } from '../screens/ExerciseDetail';
import { SessionDetail } from '../screens/SessionDetail';
import { RoutineEditor } from '../screens/RoutineEditor';
import { Summary } from '../screens/Summary';
import { SettingsScreen } from '../screens/Settings';

export function App() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLive = useLiveStore((s) => s.hydrate);
  const liveLoaded = useLiveStore((s) => s.loaded);
  const startTick = useLiveStore((s) => s.startTick);

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
    const flush = () => flushLiveWrite(useLiveStore.getState().live);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  if (!settingsLoaded || !liveLoaded) return null;

  return (
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
  );
}
