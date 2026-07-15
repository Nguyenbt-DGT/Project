import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';

// Rule 4.3: session persistence uses expo-secure-store, never AsyncStorage.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Rule 4.4: the single Supabase client for the whole app — import from here only.
// TODO(Rule 2.3): after the first migration, generate src/types/database.types.ts and add
// createClient<Database>(...) so all queries are typed.
export const supabase = createClient(
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
