import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function todaysDistanceQueryKey(vehicleId: string) {
  return ['health-check', 'todays-distance', vehicleId] as const;
}

/**
 * Sum of today's recorded trips' distance (HEALTH_REQ §3). Live GPS ride recording is
 * MAP_TRACKING's flow, deferred here per D-HEALTH-MVP-SCOPE — this reads whatever trips have
 * already been recorded (and applied) today, summing to 0 when there are none.
 */
export function useTodaysDistanceKm(vehicleId: string | undefined) {
  return useQuery({
    queryKey: todaysDistanceQueryKey(vehicleId ?? ''),
    queryFn: async (): Promise<number> => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('trips')
        .select('distance_km')
        .eq('vehicle_id', vehicleId as string)
        .gte('recorded_at', startOfDay.toISOString());
      if (error) throw error;
      return data.reduce((total, trip) => total + trip.distance_km, 0);
    },
    enabled: Boolean(vehicleId),
  });
}
