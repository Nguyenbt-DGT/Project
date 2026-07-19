import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { VEHICLE_QUERY_KEY } from './use-vehicle';

export interface OnboardVehicleInput {
  name: string;
  brand: string;
  currentOdometerKm: number;
  unit: 'km' | 'mi';
  /** type_keys of parts the user marked as recently changed (start Fresh). */
  recentlyChanged: string[];
}

/**
 * First-login onboarding (GLOBAL_REQ §2): creates the user's vehicle and seeds its service items
 * from part_type_defaults in one atomic RPC (`onboard_vehicle`, Rule 4.5). Recently-changed parts
 * start Fresh; others reflect accumulated km-wear.
 */
export function useOnboardVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OnboardVehicleInput): Promise<Tables<'vehicles'>> => {
      const { data, error } = await supabase.rpc('onboard_vehicle', {
        p_name: input.name,
        p_brand: input.brand,
        p_current_odometer_km: input.currentOdometerKm,
        p_unit: input.unit,
        p_recently_changed: input.recentlyChanged,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (vehicle) => {
      // Seed the cache synchronously (not just invalidate+refetch in the background) — Home/Health
      // mount immediately after this resolves and must not render a stale "no vehicle yet" empty
      // state while an unawaited background refetch is still in flight (DEMO_FEEDBACK_006 #3).
      queryClient.setQueryData(VEHICLE_QUERY_KEY, vehicle);
    },
  });
}
