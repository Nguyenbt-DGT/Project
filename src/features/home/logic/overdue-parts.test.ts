// Unit tests for the Home overdue-parts derivation (DEMO_FEEDBACK_005 #7). No React, no Supabase
// (Rule 1.3).

import { describe, expect, it } from '@jest/globals';

import type { VehicleOdometer } from '@/features/health-check/logic/status';

import { computeOverdueParts, type OverduePartRow } from './overdue-parts';

const vehicle: VehicleOdometer = { current_odometer_km: 25000 };
const now = new Date('2026-01-01T00:00:00.000Z');

function kmItem(
  id: string,
  name: string,
  typeKey: string,
  lastServiceKm: number,
  intervalKm: number
): OverduePartRow {
  return {
    id,
    name,
    type_key: typeKey,
    interval_km: intervalKm,
    interval_days: null,
    interval_events: null,
    last_service_km: lastServiceKm,
    last_service_at: null,
    events_elapsed: 0,
  };
}

describe('computeOverdueParts', () => {
  it('returns an empty list when nothing is overdue', () => {
    const items = [kmItem('1', 'Engine oil', 'engine_oil', 24000, 2500)]; // 40% — fresh
    expect(computeOverdueParts(items, vehicle, now, 'km', 'en')).toEqual([]);
  });

  it('includes only overdue items, excluding fresh/due_soon/replace ones', () => {
    const items = [
      kmItem('1', 'Engine oil', 'engine_oil', 24000, 2500), // 40% fresh
      kmItem('2', 'Chain', 'chain', 5000, 20000), // (25000-5000)/20000 = 100% replace (boundary, not overdue)
      kmItem('3', 'Spark plug', 'spark_plug', 0, 15000), // 166.7% overdue
    ];
    const result = computeOverdueParts(items, vehicle, now, 'km', 'en');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('3');
  });

  it('sorts worst (most overdue) first', () => {
    const items = [
      kmItem('a', 'Chain', 'chain', 0, 20000), // 125% overdue
      kmItem('b', 'Spark plug', 'spark_plug', 0, 15000), // 166.7% overdue — worse
    ];
    const result = computeOverdueParts(items, vehicle, now, 'km', 'en');
    expect(result.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('translates the part name and reuses the exact Health-tab overdue wording', () => {
    const items = [kmItem('1', 'Engine oil', 'engine_oil', 0, 2500)]; // 1000% overdue
    const [result] = computeOverdueParts(items, vehicle, now, 'km', 'vi');
    expect(result?.name).toBe('Nhớt máy');
    expect(result?.message).toContain('Quá hạn');
  });
});
