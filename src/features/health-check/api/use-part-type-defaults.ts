import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export const PART_TYPE_DEFAULTS_QUERY_KEY = ['health-check', 'part-type-defaults'] as const;

/**
 * The shared catalog of default part types (reference data). Used by onboarding to render the
 * "which parts were recently changed?" checklist (GLOBAL_REQ §2).
 */
export function usePartTypeDefaults() {
  return useQuery({
    queryKey: PART_TYPE_DEFAULTS_QUERY_KEY,
    queryFn: async (): Promise<Tables<'part_type_defaults'>[]> => {
      const { data, error } = await supabase.from('part_type_defaults').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}
