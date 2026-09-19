import { create } from 'zustand';
import { repo } from '../data/repo';
import { DEFAULT_SETTINGS, type Settings } from '../domain/types';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  hydrate: () => Promise<void>;
  patch: (p: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  hydrate: async () => {
    const settings = await repo.getSettings();
    set({ settings, loaded: true });
  },
  patch: async (p) => {
    set({ settings: { ...get().settings, ...p } });
    const saved = await repo.patchSettings(p);
    set({ settings: saved });
  },
}));
