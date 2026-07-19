import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { VEHICLE_QUERY_KEY } from './use-vehicle';

export interface UpdateVehicleInput {
  vehicleId: string;
  name: string;
  brand: string;
  unitPreference: 'km' | 'mi';
}

/**
 * Edits the vehicle's own profile fields (name/brand/unit) — DEMO_FEEDBACK_003 #4: a persistent,
 * always-reachable place to fix bike info, not just at first-login onboarding. Odometer has its
 * own dedicated editor (`useSetOdometer`); this never touches it. Plain owner-scoped table write,
 * no cross-table invariant, so no RPC needed (Rule 4.5).
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vehicleId,
      name,
      brand,
      unitPreference,
    }: UpdateVehicleInput): Promise<Tables<'vehicles'>> => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ name, brand, unit_preference: unitPreference })
        .eq('id', vehicleId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VEHICLE_QUERY_KEY });
    },
  });
}
