import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export function spendEntriesQueryKey(vehicleId: string) {
  return ['health-check', 'spend-entries', vehicleId] as const;
}

/**
 * All spend entries for a vehicle, every year (D-OQ-H5-SPEND-YEAR: prior-year entries are
 * excluded from the *total/top-3* but must not be deleted — the year filter is applied
 * client-side via `logic/spend.ts#currentYearEntries`, not by the query itself).
 */
export function useSpendEntries(vehicleId: string | undefined) {
  return useQuery({
    queryKey: spendEntriesQueryKey(vehicleId ?? ''),
    queryFn: async (): Promise<Tables<'spend_entries'>[]> => {
      const { data, error } = await supabase
        .from('spend_entries')
        .select('*')
        .eq('vehicle_id', vehicleId as string)
        .order('spent_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(vehicleId),
  });
}
