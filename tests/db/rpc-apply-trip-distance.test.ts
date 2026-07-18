// AC-5 — apply_trip_distance(trip_id): increments the shared odometer exactly once, is idempotent
// per trip_id, and never touches any service_item row. Runs against the REAL local Supabase stack
// (Rule 6.5) using the seeded trip (supabase/seed.sql: trip 33333333-..., 355 km, vehicle
// 22222222-... at odometer 25000). This is the ONLY test file that touches the seeded vehicle/trip
// — every other DB test file creates its own fixtures — so there is no cross-file ordering hazard;
// still, run against a freshly-reset DB (`npx supabase db reset`) before this suite.

import { beforeAll, describe, expect, it } from 'vitest';

import type { Database, Tables } from '@/types/database.types';

import { SEED_TRIP_ID, SEED_VEHICLE_ID, signInAsSeedUser, signUpFreshUser } from './support';
import type { SupabaseClient } from '@supabase/supabase-js';

let user1: SupabaseClient<Database>;

beforeAll(async () => {
  user1 = await signInAsSeedUser();
});

async function fetchVehicleOdometer(): Promise<number> {
  const { data, error } = await user1
    .from('vehicles')
    .select('current_odometer_km')
    .eq('id', SEED_VEHICLE_ID)
    .single();
  if (error) throw error;
  return data.current_odometer_km;
}

async function fetchServiceItemsSnapshot(): Promise<Tables<'service_items'>[]> {
  const { data, error } = await user1
    .from('service_items')
    .select('*')
    .eq('vehicle_id', SEED_VEHICLE_ID)
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

describe('apply_trip_distance — AC-5', () => {
  it('precondition: seed DB is freshly reset (vehicle at 25000 km)', async () => {
    const odometer = await fetchVehicleOdometer();
    expect(
      odometer,
      'Expected the seeded vehicle to be at 25000 km. Run `npx supabase db reset` before ' +
        'the DB suite — this file must be the first to touch the seeded vehicle.'
    ).toBe(25000);
  });

  it('increments the shared odometer by the trip distance exactly once and touches no service_item', async () => {
    const before = await fetchServiceItemsSnapshot();

    const { data: applied, error } = await user1.rpc('apply_trip_distance', {
      p_trip_id: SEED_TRIP_ID,
    });
    expect(error).toBeNull();
    expect(applied?.distance_applied_at).not.toBeNull();
    expect(applied?.distance_km).toBe(355);

    const odometerAfter = await fetchVehicleOdometer();
    expect(odometerAfter).toBe(25355); // 25000 + 355, per AC-5 / task fixture

    const after = await fetchServiceItemsSnapshot();
    expect(after).toEqual(before); // no service_item row changed at all — not even last_service_km
  });

  it('a second call with the same trip_id is a no-op (idempotent, AC-5)', async () => {
    const firstAppliedAt = (
      await user1.from('trips').select('distance_applied_at').eq('id', SEED_TRIP_ID).single()
    ).data?.distance_applied_at;
    expect(firstAppliedAt).not.toBeNull();

    const { data: secondCall, error } = await user1.rpc('apply_trip_distance', {
      p_trip_id: SEED_TRIP_ID,
    });
    expect(error).toBeNull();
    // The idempotency marker is set once and never re-touched by a later no-op call.
    expect(secondCall?.distance_applied_at).toBe(firstAppliedAt);

    const odometerAfterSecondCall = await fetchVehicleOdometer();
    expect(odometerAfterSecondCall).toBe(25355); // NOT 25710 — not double-applied
  });

  it('rejects a nonexistent trip_id', async () => {
    const { error } = await user1.rpc('apply_trip_distance', {
      p_trip_id: '99999999-9999-9999-9999-999999999999',
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('P0002');
  });

  it('rejects applying another user\'s trip (owner-only)', async () => {
    const { client: user2 } = await signUpFreshUser();
    const { error } = await user2.rpc('apply_trip_distance', { p_trip_id: SEED_TRIP_ID });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    // Confirm the unauthorized attempt truly had no effect.
    const odometerAfter = await fetchVehicleOdometer();
    expect(odometerAfter).toBe(25355);
  });
});
