// RLS isolation — a second user cannot read or write user 1's rows on any owned table; anon is
// denied outright. Plus a schema-wide RLS audit (Rule 4.2: "a table without RLS is a release
// blocker"). Runs against the REAL local Supabase stack (Rule 6.5). Creates its own fresh
// fixtures for user1/user2 — no dependency on any other DB test file's state.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { closeAdminPgPool, createTestClient, getAdminPgPool, signInAsSeedUser, signUpFreshUser } from './support';

let user1: SupabaseClient<Database>;
let user2: SupabaseClient<Database>;
let anon: SupabaseClient<Database>;

let user1VehicleId: string;
let user1ServiceItemId: string;
let user1SpendEntryId: string;
let user1TripId: string;

beforeAll(async () => {
  user1 = await signInAsSeedUser();
  ({ client: user2 } = await signUpFreshUser());
  anon = createTestClient();

  const { data: vehicle, error: vehicleError } = await user1
    .from('vehicles')
    .insert({ name: 'QA Fixture Bike (rls)', brand: 'QA', current_odometer_km: 1000 })
    .select('id')
    .single();
  if (vehicleError) throw vehicleError;
  user1VehicleId = vehicle.id;

  const { data: item, error: itemError } = await user1
    .from('service_items')
    .insert({ vehicle_id: user1VehicleId, type_key: 'tires', name: 'Tires', interval_km: 30000, last_service_km: 0 })
    .select('id')
    .single();
  if (itemError) throw itemError;
  user1ServiceItemId = item.id;

  const { data: spend, error: spendError } = await user1
    .from('spend_entries')
    .insert({ vehicle_id: user1VehicleId, kind: 'parts', amount_cents: 1000, spent_at: '2026-01-01' })
    .select('id')
    .single();
  if (spendError) throw spendError;
  user1SpendEntryId = spend.id;

  const { data: trip, error: tripError } = await user1
    .from('trips')
    .insert({ vehicle_id: user1VehicleId, distance_km: 42 })
    .select('id')
    .single();
  if (tripError) throw tripError;
  user1TripId = trip.id;
});

afterAll(async () => {
  await closeAdminPgPool();
});

describe('RLS — cross-user read isolation (authenticated user2 vs user1 rows)', () => {
  it('user2 cannot read user1\'s vehicle', async () => {
    const { data, error } = await user2.from('vehicles').select('*').eq('id', user1VehicleId);
    expect(error).toBeNull(); // RLS filters rows silently, not an error, for SELECT
    expect(data).toEqual([]);
  });

  it('user2 cannot read user1\'s service_items', async () => {
    const { data, error } = await user2.from('service_items').select('*').eq('id', user1ServiceItemId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('user2 cannot read user1\'s spend_entries', async () => {
    const { data, error } = await user2.from('spend_entries').select('*').eq('id', user1SpendEntryId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('user2 cannot read user1\'s trips', async () => {
    const { data, error } = await user2.from('trips').select('*').eq('id', user1TripId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe('RLS — cross-user write isolation', () => {
  it('user2\'s UPDATE of user1\'s vehicle matches zero rows (silently no-ops, does not corrupt data)', async () => {
    const { data, error } = await user2
      .from('vehicles')
      .update({ current_odometer_km: 999999 })
      .eq('id', user1VehicleId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]); // 0 rows matched/updated

    const { data: stillOwned } = await user1
      .from('vehicles')
      .select('current_odometer_km')
      .eq('id', user1VehicleId)
      .single();
    expect(stillOwned?.current_odometer_km).toBe(1000); // unchanged
  });

  it('user2 cannot INSERT a service_item under user1\'s vehicle (WITH CHECK rejects it)', async () => {
    const { error } = await user2
      .from('service_items')
      .insert({ vehicle_id: user1VehicleId, type_key: 'chain', name: 'Chain', interval_km: 20000, last_service_km: 0 });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('user2\'s DELETE of user1\'s spend_entry matches zero rows (row survives)', async () => {
    const { error } = await user2.from('spend_entries').delete().eq('id', user1SpendEntryId);
    expect(error).toBeNull(); // 0 rows matched -> "successful" no-op, not an error

    const { data: stillExists } = await user1
      .from('spend_entries')
      .select('id')
      .eq('id', user1SpendEntryId)
      .single();
    expect(stillExists?.id).toBe(user1SpendEntryId);
  });

  it('user2 cannot INSERT a trip under user1\'s vehicle', async () => {
    const { error } = await user2.from('trips').insert({ vehicle_id: user1VehicleId, distance_km: 10 });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('RLS — anon is denied outright (no table-level GRANT, Rule 4.7-adjacent hardening)', () => {
  it.each(['vehicles', 'service_items', 'spend_entries', 'trips'] as const)(
    'anon cannot select from %s',
    async (table) => {
      const { data, error } = await anon.from(table).select('*');
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    }
  );

  it('anon cannot insert into vehicles', async () => {
    const { error } = await anon.from('vehicles').insert({ name: 'x', brand: 'x' });
    expect(error).not.toBeNull();
  });
});

describe('RLS audit — every public table must have row level security enabled (Rule 4.2)', () => {
  it('reports any public-schema table without RLS enabled as a release blocker', async () => {
    const pool = getAdminPgPool();
    const result = await pool.query<{ tablename: string; rowsecurity: boolean }>(
      `select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename`
    );

    expect(result.rows.length).toBeGreaterThan(0); // sanity: the audit query itself found tables

    const withoutRls = result.rows.filter((row) => !row.rowsecurity).map((row) => row.tablename);
    expect(
      withoutRls,
      `RELEASE BLOCKER (Rule 4.2): the following public tables have RLS disabled: ${withoutRls.join(', ')}`
    ).toEqual([]);
  });

  it('every HEALTH_CHECK owned table is covered by this audit (sanity — the query above is not vacuous)', async () => {
    const pool = getAdminPgPool();
    const result = await pool.query<{ tablename: string }>(
      `select tablename from pg_tables where schemaname = 'public' order by tablename`
    );
    const names = result.rows.map((r) => r.tablename);
    for (const expected of ['vehicles', 'service_items', 'spend_entries', 'trips']) {
      expect(names).toContain(expected);
    }
  });
});
