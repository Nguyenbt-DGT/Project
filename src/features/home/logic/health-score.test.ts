// Unit tests for the Home bike-health score aggregation (DEMO_FEEDBACK_004 #4, D-HOME-HEALTH-SCORE).
// No React, no Supabase (Rule 1.3).

import { describe, expect, it } from '@jest/globals';

import type { ServiceItemAxes, VehicleOdometer } from '@/features/health-check/logic/status';

import { computeHealthScore } from './health-score';

const vehicle: VehicleOdometer = { current_odometer_km: 10000 };
const now = new Date('2026-01-01T00:00:00.000Z');

function kmItem(lastServiceKm: number, intervalKm: number): ServiceItemAxes {
  return {
    interval_km: intervalKm,
    interval_days: null,
    interval_events: null,
    last_service_km: lastServiceKm,
    last_service_at: null,
    events_elapsed: 0,
  };
}

describe('computeHealthScore', () => {
  it('returns a perfect score and fresh status when there are no items', () => {
    expect(computeHealthScore([], vehicle, now)).toEqual({ score: 100, status: 'fresh' });
  });

  it('scores 100 when every item is brand new (0% progress)', () => {
    const items = [kmItem(10000, 2500), kmItem(10000, 20000)];
    expect(computeHealthScore(items, vehicle, now)).toEqual({ score: 100, status: 'fresh' });
  });

  it('scores 0 (floor) and reports overdue when an item is far past its interval', () => {
    // progress = (10000-0)/2500 = 400%, clamped to 100% for the average.
    const items = [kmItem(0, 2500)];
    const result = computeHealthScore(items, vehicle, now);
    expect(result.status).toBe('overdue');
    expect(result.score).toBe(0);
  });

  it('averages progress across items but takes the WORST status, never diluting it', () => {
    // Item A: (10000-9500)/2500 = 20% (fresh). Item B: (10000-0)/2500 = 400% -> clamped 100% (overdue).
    // Average clamped progress = (0.2 + 1.0)/2 = 0.6 -> score = round((1-0.6)*100) = 40.
    const items = [kmItem(9500, 2500), kmItem(0, 2500)];
    const result = computeHealthScore(items, vehicle, now);
    expect(result.score).toBe(40);
    expect(result.status).toBe('overdue'); // worst-of-all, not averaged away
  });

  it('ignores items with no configured axis (never divides by a phantom item)', () => {
    const noAxisItem: ServiceItemAxes = {
      interval_km: null,
      interval_days: null,
      interval_events: null,
      last_service_km: null,
      last_service_at: null,
      events_elapsed: 0,
    };
    const items = [kmItem(10000, 2500), noAxisItem];
    expect(computeHealthScore(items, vehicle, now)).toEqual({ score: 100, status: 'fresh' });
  });
});
