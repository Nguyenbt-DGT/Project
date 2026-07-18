import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { serviceItemsQueryKey } from './use-service-items';

export interface SetLastServiceInput {
  serviceItemId: string;
  vehicleId: string;
  /** The odometer (km) the part was last serviced at — the checkpoint next service counts from
   * (DEMO_FEEDBACK_002 #2). */
  lastServiceKm: number;
}

/**
 * Sets a km-based service item's `last_service_km` checkpoint. A plain owner-scoped table write
 * (RLS enforces ownership; same pattern as the price update in useMarkServiceDone) — no cross-item
 * invariant, so it doesn't need an RPC (Rule 4.5). Bounds (0..current odometer) are validated in
 * the UI before calling.
 */
export function useSetLastServiceKm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceItemId, lastServiceKm }: SetLastServiceInput): Promise<Tables<'service_items'>> => {
      const { data, error } = await supabase
        .from('service_items')
        .update({ last_service_km: lastServiceKm })
        .eq('id', serviceItemId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: serviceItemsQueryKey(variables.vehicleId) });
    },
  });
}
