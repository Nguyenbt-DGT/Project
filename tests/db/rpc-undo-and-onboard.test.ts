// DEMO_FEEDBACK_001 #5.4 (undo_last_service) and #2 (onboard_vehicle), against the REAL local
// Supabase stack (Rule 6.5). Each block builds its own throwaway fixtures, so there's no ordering
// dependency on other DB test files.

import { beforeAll, describe, expect, it } from 'vitest';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { signInAsSeedUser, signUpFreshUser } from './support';

describe('undo_last_service — reverses a mark and restores the coupled oil_filter', () => {
  let user1: SupabaseClient<Database>;
  let vehicleId: string;
  let engineOilId: string;
  let oilFilterId: string;

  beforeAll(async () => {
    user1 = await signInAsSeedUser();

    const { data: vehicle, error: vErr } = await user1
      .from('vehicles')
      .insert({ name: 'QA Fixture (undo)', brand: 'QA', current_odometer_km: 20000 })
      .select('id')
      .single();
    if (vErr) throw vErr;
    vehicleId = vehicle.id;

    const { data: engineOil, error: eErr } = await user1
      .from('service_items')
      .insert({ vehicle_id: vehicleId, type_key: 'engine_oil', name: 'Engine oil', interval_km: 2500, last_service_km: 5000 })
      .select('id')
      .single();
    if (eErr) throw eErr;
    engineOilId = engineOil.id;

    const { data: oilFilter, error: oErr } = await user1
      .from('service_items')
      .insert({ vehicle_id: vehicleId, type_key: 'oil_filter', name: 'Oil filter', interval_events: 2, events_elapsed: 0 })
      .select('id')
      .single();
    if (oErr) throw oErr;
    oilFilterId = oilFilter.id;
  });

  it('undo restores the item baseline AND the coupled oil_filter counter', async () => {
    // Mark engine oil: last_service_km 5000 -> 20000, oil_filter events 0 -> 1.
    const { error: markErr } = await user1.rpc('mark_service_done', { p_service_item_id: engineOilId });
    expect(markErr).toBeNull();

    const { data: afterMark } = await user1
      .from('service_items')
      .select('last_service_km, events_elapsed')
      .in('id', [engineOilId, oilFilterId]);
    const oilAfterMark = afterMark?.find((r) => r.last_service_km === 20000);
    expect(oilAfterMark?.last_service_km).toBe(20000);

    // Undo: engine oil baseline back to 5000, oil_filter counter back to 0.
    const { data: undone, error: undoErr } = await user1.rpc('undo_last_service', { p_service_item_id: engineOilId });
    expect(undoErr).toBeNull();
    expect(undone?.last_service_km).toBe(5000);

    const { data: oilFilter } = await user1
      .from('service_items')
      .select('events_elapsed')
      .eq('id', oilFilterId)
      .single();
    expect(oilFilter?.events_elapsed).toBe(0);
  });

  it('undo walks back sequential marks one at a time (LIFO snapshots)', async () => {
    // State after previous test: engine_oil.last=5000, oil_filter=0.
    await user1.rpc('mark_service_done', { p_service_item_id: engineOilId }); // event A: prev last=5000, prev oil=0
    await user1.rpc('mark_service_done', { p_service_item_id: engineOilId }); // event B: prev last=20000, prev oil=1

    let { data: oil } = await user1.from('service_items').select('events_elapsed').eq('id', oilFilterId).single();
    expect(oil?.events_elapsed).toBe(2);

    await user1.rpc('undo_last_service', { p_service_item_id: engineOilId }); // reverse B -> oil=1
    ({ data: oil } = await user1.from('service_items').select('events_elapsed').eq('id', oilFilterId).single());
    expect(oil?.events_elapsed).toBe(1);

    const { data: undoneA } = await user1.rpc('undo_last_service', { p_service_item_id: engineOilId }); // reverse A
    expect(undoneA?.last_service_km).toBe(5000);
    ({ data: oil } = await user1.from('service_items').select('events_elapsed').eq('id', oilFilterId).single());
    expect(oil?.events_elapsed).toBe(0);
  });

  it('errors when there is nothing left to undo', async () => {
    const { error } = await user1.rpc('undo_last_service', { p_service_item_id: engineOilId });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('P0002');
  });

  it('a second user cannot undo another user\'s item', async () => {
    // First create a fresh mark to undo, then attempt it as user2.
    await user1.rpc('mark_service_done', { p_service_item_id: engineOilId });
    const { client: user2 } = await signUpFreshUser();
    const { error } = await user2.rpc('undo_last_service', { p_service_item_id: engineOilId });
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('onboard_vehicle — first-login vehicle + service item creation', () => {
  it('creates the vehicle and seeds service items with the right baselines', async () => {
    const { client } = await signUpFreshUser();

    const { data: vehicle, error } = await client.rpc('onboard_vehicle', {
      p_name: 'Test Bike',
      p_brand: 'Honda',
      p_current_odometer_km: 10000,
      p_unit: 'km',
      p_recently_changed: ['engine_oil'],
    });
    expect(error).toBeNull();
    expect(vehicle?.name).toBe('Test Bike');
    expect(vehicle?.current_odometer_km).toBe(10000);
    expect(vehicle?.unit_preference).toBe('km');

    const { data: items } = await client
      .from('service_items')
      .select('type_key, last_service_km, events_elapsed')
      .eq('vehicle_id', vehicle!.id);

    // One service item per part_type_defaults row (13, Battery excluded per D-OQ-H7).
    expect(items).toHaveLength(13);

    // Recently-changed engine_oil -> baseline = entered odometer (Fresh / 0%).
    const engineOil = items?.find((i) => i.type_key === 'engine_oil');
    expect(engineOil?.last_service_km).toBe(10000);

    // Not recently-changed km part -> baseline 0 (reflects accumulated wear).
    const sparkPlug = items?.find((i) => i.type_key === 'spark_plug');
    expect(sparkPlug?.last_service_km).toBe(0);

    // Event-axis oil filter starts at 0 elapsed events (D-OQ-H9).
    const oilFilter = items?.find((i) => i.type_key === 'oil_filter');
    expect(oilFilter?.events_elapsed).toBe(0);
  });

  it('rejects a negative odometer and an invalid unit', async () => {
    const { client } = await signUpFreshUser();

    const { error: negErr } = await client.rpc('onboard_vehicle', {
      p_name: 'Bad', p_brand: 'X', p_current_odometer_km: -1, p_unit: 'km', p_recently_changed: [],
    });
    expect(negErr).not.toBeNull();

    const { error: unitErr } = await client.rpc('onboard_vehicle', {
      p_name: 'Bad', p_brand: 'X', p_current_odometer_km: 100, p_unit: 'furlongs', p_recently_changed: [],
    });
    expect(unitErr).not.toBeNull();
  });
});
