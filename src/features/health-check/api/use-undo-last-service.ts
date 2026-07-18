import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { serviceItemsQueryKey } from './use-service-items';

export interface UndoLastServiceInput {
  serviceItemId: string;
  vehicleId: string;
}

/**
 * Reverses the most recent "mark as replaced" for a service item via the `undo_last_service` RPC
 * (server restores the baseline snapshot + the coupled oil_filter counter — Rule 4.5,
 * DEMO_FEEDBACK_001 #5.4). Only the wear baseline is restored; any price/spend entry recorded
 * alongside the mark is intentionally left in place (see KNOWN_ISSUES).
 */
export function useUndoLastService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceItemId }: UndoLastServiceInput): Promise<Tables<'service_items'>> => {
      const { data, error } = await supabase.rpc('undo_last_service', {
        p_service_item_id: serviceItemId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: serviceItemsQueryKey(variables.vehicleId) });
    },
  });
}
