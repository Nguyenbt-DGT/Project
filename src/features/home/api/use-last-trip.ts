import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export function lastTripQueryKey(vehicleId: string) {
  return ['home', 'last-trip', vehicleId] as const;
}

/**
 * The most recently recorded trip for this vehicle, or `null` if none exist yet — drives the
 * hero card's "Last ride · N km · N nights ago" caption (HOME_REQ.md §3.1 mockup).
 */
export function useLastTrip(vehicleId: string | undefined) {
  return useQuery({
    queryKey: lastTripQueryKey(vehicleId ?? ''),
    queryFn: async (): Promise<Tables<'trips'> | null> => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId as string)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(vehicleId),
  });
}
