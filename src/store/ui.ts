import { create } from 'zustand';
import type { ExerciseId, FieldKey } from '../domain/types';

export interface KeypadTarget {
  /** Live entry id */
  entryId: string;
  setId: string;
  field: FieldKey;
  exerciseName: string;
  setLabel: string;
}

export interface PickerState {
  mode: 'add-to-session' | 'add-to-routine';
  search: string;
  muscle: string | null;
  equipment: string | null;
  selected: string[];
}

export interface RoutineDraft {
  /** existing routine id, or 'new' */
  key: string;
  name: string;
  exerciseIds: ExerciseId[];
}

interface UIState {
  keypad: KeypadTarget | null;
  keypadBuffer: string;
  picker: PickerState | null;
  canInstall: boolean;
  installPrompt: unknown;
  routineDraft: RoutineDraft | null;

  openKeypad: (t: KeypadTarget) => void;
  closeKeypad: () => void;
  setKeypadBuffer: (b: string) => void;

  openPicker: (mode: PickerState['mode']) => void;
  closePicker: () => void;
  setPickerSearch: (s: string) => void;
  setPickerMuscle: (m: string | null) => void;
  setPickerEquipment: (e: string | null) => void;
  togglePickerSelected: (id: string) => void;

  setCanInstall: (v: boolean, prompt?: unknown) => void;

  setRoutineDraft: (d: RoutineDraft) => void;
  clearRoutineDraft: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  keypad: null,
  keypadBuffer: '',
  picker: null,
  canInstall: false,
  installPrompt: null,
  routineDraft: null,

  openKeypad: (t) => set({ keypad: t, keypadBuffer: '' }),
  closeKeypad: () => set({ keypad: null, keypadBuffer: '' }),
  setKeypadBuffer: (b) => set({ keypadBuffer: b }),

  openPicker: (mode) => set({ picker: { mode, search: '', muscle: null, equipment: null, selected: [] } }),
  closePicker: () => set({ picker: null }),
  setPickerSearch: (s) => set((st) => (st.picker ? { picker: { ...st.picker, search: s } } : st)),
  setPickerMuscle: (m) => set((st) => (st.picker ? { picker: { ...st.picker, muscle: m } } : st)),
  setPickerEquipment: (e) => set((st) => (st.picker ? { picker: { ...st.picker, equipment: e } } : st)),
  togglePickerSelected: (id) => {
    const p = get().picker;
    if (!p) return;
    const has = p.selected.includes(id);
    set({ picker: { ...p, selected: has ? p.selected.filter((x) => x !== id) : [...p.selected, id] } });
  },

  setCanInstall: (v, prompt) => set({ canInstall: v, installPrompt: prompt }),

  setRoutineDraft: (d) => set({ routineDraft: d }),
  clearRoutineDraft: () => set({ routineDraft: null }),
}));
