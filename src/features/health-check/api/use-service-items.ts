import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export function serviceItemsQueryKey(vehicleId: string) {
  return ['health-check', 'service-items', vehicleId] as const;
}

/** All service items for a vehicle (KB §2.2: metrics are user-extensible rows, never a fixed
 * list). */
export function useServiceItems(vehicleId: string | undefined) {
  return useQuery({
    queryKey: serviceItemsQueryKey(vehicleId ?? ''),
    queryFn: async (): Promise<Tables<'service_items'>[]> => {
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('vehicle_id', vehicleId as string)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(vehicleId),
  });
}
