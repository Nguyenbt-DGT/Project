import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export const BIKE_CATALOG_QUERY_KEY = ['health-check', 'bike-catalog'] as const;

/**
 * The shared brand/bike catalog (small curated sample, D-OQ-H4 — see the migration's own comment).
 * Drives the brand/name dropdowns in the vehicle editor (DEMO_FEEDBACK_005 mid-turn request:
 * "since we have database now, brand and name should be dropdowns").
 */
export function useBikeCatalog() {
  return useQuery({
    queryKey: BIKE_CATALOG_QUERY_KEY,
    queryFn: async (): Promise<Tables<'bike_catalog'>[]> => {
      const { data, error } = await supabase
        .from('bike_catalog')
        .select('*')
        .order('brand')
        .order('bike');
      if (error) throw error;
      return data ?? [];
    },
  });
}
