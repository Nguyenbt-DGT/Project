import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';

import { serviceItemsQueryKey } from './use-service-items';

export type ServiceItemPatch = Pick<
  TablesUpdate<'service_items'>,
  | 'interval_km'
  | 'interval_days'
  | 'interval_events'
  | 'last_service_km'
  | 'last_service_at'
  | 'events_elapsed'
  | 'price_cents'
>;

export interface UpdateServiceItemInput {
  serviceItemId: string;
  vehicleId: string;
  patch: ServiceItemPatch;
}

/**
 * General-purpose service-item field editor (DEMO_FEEDBACK_004 #3: interval, last-service on any
 * axis, and price are all directly editable in the detail popup). A single owner-scoped table
 * write covers all of them — none of these fields have a cross-table invariant, so a plain
 * Supabase client `.update()` is correct (Rule 4.5; RPCs are reserved for cross-row invariants like
 * `mark_service_done`'s engine_oil -> oil_filter coupling). Supersedes the earlier narrow
 * `useSetLastServiceKm` (km-axis-only) hook.
 */
export function useUpdateServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceItemId,
      patch,
    }: UpdateServiceItemInput): Promise<Tables<'service_items'>> => {
      const { data, error } = await supabase
        .from('service_items')
        .update(patch)
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
