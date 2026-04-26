import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPPORTED_LANGUAGES = [
  { code: 'sv', label: 'Svenska' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const STORAGE_KEY = 'app_language';

export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(async (code: LangCode) => {
    await AsyncStorage.setItem(STORAGE_KEY, code);
    await i18n.changeLanguage(code);
  }, [i18n]);

  return {
    currentLanguage: i18n.language as LangCode,
    setLanguage,
  };
}

export async function loadPersistedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
