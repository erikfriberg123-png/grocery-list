import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { LightPalette, DarkPalette, category, type ThemePalette } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem('theme_mode', mode);
  },
  toggle: () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light';
    set({ mode: next });
    AsyncStorage.setItem('theme_mode', next);
  },
}));

// Load persisted preference at module init (before first render)
AsyncStorage.getItem('theme_mode').then((val) => {
  if (val === 'dark' || val === 'light') {
    useThemeStore.setState({ mode: val });
  }
});

export function useThemeColors(): ThemePalette {
  const mode = useThemeStore((s) => s.mode);
  return { ...(mode === 'dark' ? DarkPalette : LightPalette), category };
}
