import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';
import type { Database } from '@/types/database.types';

// Rule 4.3: session persistence uses expo-secure-store, never AsyncStorage.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Rule 4.4: the single Supabase client for the whole app — import from here only.
export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
