import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export const VEHICLE_QUERY_KEY = ['health-check', 'vehicle'] as const;

/**
 * MVP is single-vehicle-in-the-UI (D-OQ-G2-MULTI-VEHICLE) — returns the current user's one
 * vehicle, or `null` if none exists yet (e.g. onboarding not completed; the screen treats that as
 * its empty state).
 */
export function useVehicle() {
  return useQuery({
    queryKey: VEHICLE_QUERY_KEY,
    queryFn: async (): Promise<Tables<'vehicles'> | null> => {
      const { data, error } = await supabase.from('vehicles').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
