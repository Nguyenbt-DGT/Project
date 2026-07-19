import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';
import type { Database } from '@/types/database.types';

// Rule 4.3: session persistence uses expo-secure-store on native. expo-secure-store has no web
// implementation (KNOWN_ISSUES.md KI-1 — calling it throws "getValueWithKeyAsync is not a
// function"), so web falls back to localStorage. Less secure than the OS keychain, but it's the
// only persistence option in a browser tab, and web is not this app's primary target.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorageAdapter = {
  getItem: async (key: string) => window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: async (key: string) => window.localStorage.removeItem(key),
};

// Rule 4.4: the single Supabase client for the whole app — import from here only.
export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorageAdapter : secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
