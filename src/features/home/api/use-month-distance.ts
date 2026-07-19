import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function monthDistanceQueryKey(vehicleId: string) {
  return ['home', 'month-distance', vehicleId] as const;
}

/**
 * Sum of this calendar month's recorded trips' distance (HOME_REQ.md §4/Home-2nd-session — "This
 * month" tracks alongside Total Distance via GPS). Same shape as health-check's
 * `useTodaysDistanceKm`, scoped to the current device-local month instead of today.
 */
export function useMonthDistanceKm(vehicleId: string | undefined) {
  return useQuery({
    queryKey: monthDistanceQueryKey(vehicleId ?? ''),
    queryFn: async (): Promise<number> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('trips')
        .select('distance_km')
        .eq('vehicle_id', vehicleId as string)
        .gte('recorded_at', startOfMonth.toISOString());
      if (error) throw error;
      return data.reduce((total, trip) => total + trip.distance_km, 0);
    },
    enabled: Boolean(vehicleId),
  });
}
