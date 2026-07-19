import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export const CURRENT_USER_QUERY_KEY = ['auth', 'current-user'] as const;
export const PROFILE_QUERY_KEY = ['auth', 'profile'] as const;

/**
 * The currently signed-in Supabase Auth user (or `null` if signed out) — backs the cross-tab
 * profile popup (DEMO_FEEDBACK_005 #5). Shared across features, so it lives here rather than
 * inside any one `src/features/*` folder (Rule 1.1 — app-wide auth concern, not feature-owned).
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async (): Promise<User | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
}

/** Signs out and clears every cached query — the next screen must never show the previous user's
 * data (vehicle, service items, etc.) even for an instant. */
export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };
}

/**
 * The signed-in user's `profiles` row (DEMO_FEEDBACK_005 #4, `20260719090000_create_profiles.sql`)
 * — auto-created by a DB trigger on sign-up, so this always resolves once a session exists.
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async (): Promise<Tables<'profiles'> | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Edits the signed-in user's own profile (owner-scoped by RLS — Rule 4.2). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string): Promise<Tables<'profiles'>> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('id', user.id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
