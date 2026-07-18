import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

import { localDateString } from '../logic/spend';
import { serviceItemsQueryKey } from './use-service-items';
import { spendEntriesQueryKey } from './use-spend-entries';

export interface MarkServiceDoneInput {
  serviceItemId: string;
  vehicleId: string;
  /** Optional per-part price entered alongside "mark as replaced" (HEALTH_REQ §4.2). When
   * present (> 0), also logs a spend_entries row so Spent-this-year updates without extra
   * navigation (HEALTH_ACCEPTANCE AC-2). */
  priceCents?: number;
  partTypeKey?: string;
}

/**
 * Calls the `mark_service_done` RPC (server-side owns the baseline reset + the engine_oil ->
 * oil_filter events_elapsed coupling, Rule 4.5 / D-OQ-H9-OIL-FILTER-SEEDING) and, only when a
 * price was entered, separately (a) records that price on the item itself, so the Service
 * Reminders running total reflects it immediately, and (b) inserts a spend_entries row so
 * Spent-this-year updates too (HEALTH_ACCEPTANCE AC-2). Both are plain table writes, not hidden
 * cross-table invariants, so they're fine as normal client-side writes per Rule 4.5.
 */
export function useMarkServiceDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceItemId,
      vehicleId,
      priceCents,
      partTypeKey,
    }: MarkServiceDoneInput): Promise<Tables<'service_items'>> => {
      const { data: updatedItem, error: rpcError } = await supabase.rpc('mark_service_done', {
        p_service_item_id: serviceItemId,
      });
      if (rpcError) throw rpcError;

      if (priceCents != null && priceCents > 0) {
        const { error: priceError } = await supabase
          .from('service_items')
          .update({ price_cents: priceCents })
          .eq('id', serviceItemId);
        if (priceError) throw priceError;
        updatedItem.price_cents = priceCents;

        const { error: spendError } = await supabase.from('spend_entries').insert({
          vehicle_id: vehicleId,
          kind: 'parts',
          amount_cents: priceCents,
          part_type_key: partTypeKey ?? updatedItem.type_key,
          spent_at: localDateString(new Date()),
        });
        if (spendError) throw spendError;
      }

      return updatedItem;
    },
    onSuccess: (_updatedItem, variables) => {
      void queryClient.invalidateQueries({ queryKey: serviceItemsQueryKey(variables.vehicleId) });
      if (variables.priceCents != null && variables.priceCents > 0) {
        void queryClient.invalidateQueries({ queryKey: spendEntriesQueryKey(variables.vehicleId) });
      }
    },
  });
}
