import { useMemo } from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Key, Locale, categoryName, translate } from './locales';

const STORAGE_KEY = 'sevasathi.locale';

interface LocaleState {
  locale: Locale | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (l: Locale) => Promise<void>;
}

export const useLocale = create<LocaleState>((set) => ({
  locale: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const locale = raw === 'hi' || raw === 'mr' || raw === 'en' ? (raw as Locale) : null;
      set({ locale, hydrated: true });
    } catch {
      set({ locale: null, hydrated: true });
    }
  },
  setLocale: async (l) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, l);
    } catch {
      // persistence best-effort; in-memory locale still applies
    }
    set({ locale: l });
  },
}));

/** Reactive translator — re-renders the caller on language change. */
export function useT(): { t: (key: Key) => string; locale: Locale; catName: (id: string, fallback: string) => string } {
  const locale = useLocale((s) => s.locale) ?? 'en';
  return useMemo(
    () => ({
      t: (key: Key) => translate(locale, key),
      locale,
      catName: (id: string, fallback: string) => categoryName(locale, id, fallback),
    }),
    [locale],
  );
}
