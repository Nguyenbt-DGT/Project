import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export type Language = 'en' | 'vi';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const STORAGE_KEY = 'app_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/**
 * App-wide language state (English / Vietnamese — DEMO_FEEDBACK_002 #1). Persisted with
 * expo-secure-store on native; on web (no SecureStore implementation, see KNOWN_ISSUES KI-1) the
 * read/write are wrapped in try/catch so the switch still works in-session and defaults to English.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (active && (stored === 'en' || stored === 'vi')) setLanguageState(stored);
      } catch {
        // No persistence available (e.g. web) — keep the default.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
      // Best-effort persistence; ignore failures.
    });
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
