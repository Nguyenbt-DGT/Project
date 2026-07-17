// AC-2 — mark_service_done resets only the target item's baseline; a price+spend entry can be
// recorded alongside it. AC-3 — Oil Filter's event-count axis increments once per Engine Oil
// mark-done, and resets independently when Oil Filter itself is marked done
// (D-OQ-H9-OIL-FILTER-SEEDING). Runs against the REAL local Supabase stack (Rule 6.5).
//
// This file creates its OWN fresh vehicle + service items (rather than the seeded vehicle
// 22222222-...) so it has no ordering dependency on any other DB test file — see
// tests/db/rpc-apply-trip-distance.test.ts, the only file that touches seeded rows.
//
// The tests below are an intentional SEQUENCE (each builds on the previous call's DB state,
// mirroring AC-3's "1st / 2nd / 3rd oil change" narrative) — do not reorder or parallelize them.

import { beforeAll, describe, expect, it } from 'vitest';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { signInAsSeedUser, signUpFreshUser } from './support';

// Deliberately NOT importing from src/features/health-check/logic/spend here (Rule 1.2: this
// suite lives outside src/features/, and the feature's index.ts doesn't export its internals —
// deep-importing them would cross the same boundary Rule 1.2 exists to prevent). The pure
// currentYearEntries/spendTotalCents/topNSpend/localDateString functions already have exhaustive
// unit coverage in logic/spend.test.ts; this DB suite only needs to prove the WRITE path works,
// so a trivial inline date format is enough here.
function localDateStringForTest(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let user1: SupabaseClient<Database>;
let vehicleId: string;
let engineOilId: string;
let oilFilterId: string;
let controlItemId: string; // "tires" — must stay untouched by every mark_service_done call below

beforeAll(async () => {
  user1 = await signInAsSeedUser();

  const { data: vehicle, error: vehicleError } = await user1
    .from('vehicles')
    .insert({ name: 'QA Fixture Bike (mark-service-done)', brand: 'QA', current_odometer_km: 12300 })
    .select('id')
    .single();
  if (vehicleError) throw vehicleError;
  vehicleId = vehicle.id;

  const { data: engineOil, error: engineOilError } = await user1
    .from('service_items')
    .insert({
      vehicle_id: vehicleId,
      type_key: 'engine_oil',
      name: 'Engine oil',
      interval_km: 2500,
      last_service_km: 10000, // -> progress 112% (Overdue) at odometer 12300, per AC-2 fixture
    })
    .select('id')
    .single();
  if (engineOilError) throw engineOilError;
  engineOilId = engineOil.id;

  const { data: oilFilter, error: oilFilterError } = await user1
    .from('service_items')
    .insert({
      vehicle_id: vehicleId,
      type_key: 'oil_filter',
      name: 'Oil filter',
      interval_events: 2,
      events_elapsed: 0,
    })
    .select('id')
    .single();
  if (oilFilterError) throw oilFilterError;
  oilFilterId = oilFilter.id;

  const { data: controlItem, error: controlError } = await user1
    .from('service_items')
    .insert({
      vehicle_id: vehicleId,
      type_key: 'tires',
      name: 'Tires',
      interval_km: 30000,
      last_service_km: 5000,
    })
    .select('id')
    .single();
  if (controlError) throw controlError;
  controlItemId = controlItem.id;
});

describe('mark_service_done — AC-2 (resets only the target item)', () => {
  it('resets Engine Oil to the vehicle current odometer, touches no other item or the vehicle (1st Engine Oil mark-done)', async () => {
    const { data: updated, error } = await user1.rpc('mark_service_done', {
      p_service_item_id: engineOilId,
    });
    expect(error).toBeNull();
    expect(updated?.last_service_km).toBe(12300); // vehicle's current_odometer_km at call time

    const { data: vehicle } = await user1
      .from('vehicles')
      .select('current_odometer_km')
      .eq('id', vehicleId)
      .single();
    expect(vehicle?.current_odometer_km).toBe(12300); // unchanged

    const { data: control } = await user1
      .from('service_items')
      .select('last_service_km')
      .eq('id', controlItemId)
      .single();
    expect(control?.last_service_km).toBe(5000); // unchanged — no cross-item bleed

    // D-OQ-H9 coupling: Oil Filter's event counter bumps by 1 -> 1 of 2 -> 50% -> Fresh (AC-3).
    const { data: oilFilter } = await user1
      .from('service_items')
      .select('events_elapsed')
      .eq('id', oilFilterId)
      .single();
    expect(oilFilter?.events_elapsed).toBe(1);
  });

  it('an entered price both updates the item and creates a matching spend_entries row (AC-2)', async () => {
    const priceCents = 3000; // $30

    const { error: priceError } = await user1
      .from('service_items')
      .update({ price_cents: priceCents })
      .eq('id', controlItemId);
    expect(priceError).toBeNull();

    const { error: spendError } = await user1.from('spend_entries').insert({
      vehicle_id: vehicleId,
      kind: 'parts',
      amount_cents: priceCents,
      part_type_key: 'tires',
      spent_at: localDateStringForTest(new Date()),
    });
    expect(spendError).toBeNull();

    const { data: item } = await user1
      .from('service_items')
      .select('price_cents')
      .eq('id', controlItemId)
      .single();
    expect(item?.price_cents).toBe(priceCents);

    const { data: entries, error: fetchError } = await user1
      .from('spend_entries')
      .select('*')
      .eq('vehicle_id', vehicleId);
    expect(fetchError).toBeNull();
    expect(entries).toHaveLength(1);
    expect(entries?.[0]?.amount_cents).toBe(priceCents); // the write round-trips correctly
  });
});

describe('mark_service_done — AC-3 (Oil Filter event-count sequence)', () => {
  it('2nd Engine Oil mark-done -> Oil Filter 2 of 2 -> progress 100% -> Replace boundary', async () => {
    const { error } = await user1.rpc('mark_service_done', { p_service_item_id: engineOilId });
    expect(error).toBeNull();

    const { data: oilFilter } = await user1
      .from('service_items')
      .select('events_elapsed')
      .eq('id', oilFilterId)
      .single();
    expect(oilFilter?.events_elapsed).toBe(2);
  });

  it('3rd Engine Oil mark-done (filter still not replaced) -> Oil Filter 3 of 2 -> progress 150% -> Overdue', async () => {
    const { error } = await user1.rpc('mark_service_done', { p_service_item_id: engineOilId });
    expect(error).toBeNull();

    const { data: oilFilter } = await user1
      .from('service_items')
      .select('events_elapsed')
      .eq('id', oilFilterId)
      .single();
    expect(oilFilter?.events_elapsed).toBe(3);
  });

  it('marking Oil Filter itself resets its own counter to 0, independent of Engine Oil km baseline', async () => {
    const { data: updatedFilter, error } = await user1.rpc('mark_service_done', {
      p_service_item_id: oilFilterId,
    });
    expect(error).toBeNull();
    expect(updatedFilter?.events_elapsed).toBe(0);

    // Engine Oil's own km-based last_service_km must be untouched by marking a DIFFERENT item.
    const { data: engineOil } = await user1
      .from('service_items')
      .select('last_service_km')
      .eq('id', engineOilId)
      .single();
    expect(engineOil?.last_service_km).toBe(12300); // unchanged from the 1st mark-done call
  });
});

describe('mark_service_done — owner-only', () => {
  it('a second user cannot mark another user\'s service item done', async () => {
    const { client: user2 } = await signUpFreshUser();
    const { error } = await user2.rpc('mark_service_done', { p_service_item_id: engineOilId });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    // Confirm the unauthorized attempt truly had no effect.
    const { data: engineOil } = await user1
      .from('service_items')
      .select('last_service_km')
      .eq('id', engineOilId)
      .single();
    expect(engineOil?.last_service_km).toBe(12300);
  });
});
