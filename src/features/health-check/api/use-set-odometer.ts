import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { serviceItemsQueryKey } from './use-service-items';
import { VEHICLE_QUERY_KEY } from './use-vehicle';

export interface SetOdometerInput {
  vehicleId: string;
  /** Whole km, already converted from the display unit if needed
   * (`logic/units.ts#roundKmForStorage`) — this hook never converts units itself. */
  valueKm: number;
}

/** Manual odometer edit (D-OQ-H1-ODOMETER-SOURCE), via the `set_odometer` RPC. Never touches any
 * service item's baseline (Rule 4.5). */
export function useSetOdometer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, valueKm }: SetOdometerInput): Promise<Tables<'vehicles'>> => {
      const { data, error } = await supabase.rpc('set_odometer', {
        p_vehicle_id: vehicleId,
        p_value_km: valueKm,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedVehicle) => {
      queryClient.setQueryData(VEHICLE_QUERY_KEY, updatedVehicle);
      void queryClient.invalidateQueries({ queryKey: serviceItemsQueryKey(updatedVehicle.id) });
    },
  });
}
