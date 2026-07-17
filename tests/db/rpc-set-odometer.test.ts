// set_odometer(vehicle_id, value_km) — manual absolute odometer set (D-OQ-H1-ODOMETER-SOURCE).
// Rejects negatives; owner-only; never touches any service_item baseline. Runs against the REAL
// local Supabase stack (Rule 6.5). Uses its own freshly-created vehicle — no dependency on any
// other DB test file's state.

import { beforeAll, describe, expect, it } from 'vitest';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { signInAsSeedUser, signUpFreshUser } from './support';

let user1: SupabaseClient<Database>;
let vehicleId: string;
let itemId: string;

beforeAll(async () => {
  user1 = await signInAsSeedUser();

  const { data: vehicle, error: vehicleError } = await user1
    .from('vehicles')
    .insert({ name: 'QA Fixture Bike (set-odometer)', brand: 'QA', current_odometer_km: 5000 })
    .select('id')
    .single();
  if (vehicleError) throw vehicleError;
  vehicleId = vehicle.id;

  const { data: item, error: itemError } = await user1
    .from('service_items')
    .insert({
      vehicle_id: vehicleId,
      type_key: 'chain_lube',
      name: 'Chain lube',
      interval_km: 500,
      last_service_km: 4800,
    })
    .select('id')
    .single();
  if (itemError) throw itemError;
  itemId = item.id;
});

describe('set_odometer', () => {
  it('sets the vehicle current_odometer_km to the given absolute value', async () => {
    const { data: updated, error } = await user1.rpc('set_odometer', {
      p_vehicle_id: vehicleId,
      p_value_km: 5200,
    });
    expect(error).toBeNull();
    expect(updated?.current_odometer_km).toBe(5200);
  });

  it('never touches any service_item baseline', async () => {
    const { data: item } = await user1
      .from('service_items')
      .select('last_service_km')
      .eq('id', itemId)
      .single();
    expect(item?.last_service_km).toBe(4800); // unchanged despite the odometer moving
  });

  it('rejects a negative value', async () => {
    const { error } = await user1.rpc('set_odometer', { p_vehicle_id: vehicleId, p_value_km: -1 });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('22003');

    const { data: vehicle } = await user1
      .from('vehicles')
      .select('current_odometer_km')
      .eq('id', vehicleId)
      .single();
    expect(vehicle?.current_odometer_km).toBe(5200); // unchanged by the rejected call
  });

  it('accepts zero (boundary — not negative)', async () => {
    const { error } = await user1.rpc('set_odometer', { p_vehicle_id: vehicleId, p_value_km: 0 });
    expect(error).toBeNull();

    const { data: vehicle } = await user1
      .from('vehicles')
      .select('current_odometer_km')
      .eq('id', vehicleId)
      .single();
    expect(vehicle?.current_odometer_km).toBe(0);

    // Restore for any subsequent assertions in this file.
    await user1.rpc('set_odometer', { p_vehicle_id: vehicleId, p_value_km: 5200 });
  });

  it('is owner-only — a second user cannot set another user\'s vehicle odometer', async () => {
    const { client: user2 } = await signUpFreshUser();
    const { error } = await user2.rpc('set_odometer', { p_vehicle_id: vehicleId, p_value_km: 99999 });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    const { data: vehicle } = await user1
      .from('vehicles')
      .select('current_odometer_km')
      .eq('id', vehicleId)
      .single();
    expect(vehicle?.current_odometer_km).toBe(5200); // unaffected by the unauthorized attempt
  });

  it('rejects a nonexistent vehicle_id', async () => {
    const { error } = await user1.rpc('set_odometer', {
      p_vehicle_id: '99999999-9999-9999-9999-999999999999',
      p_value_km: 100,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('P0002');
  });
});
