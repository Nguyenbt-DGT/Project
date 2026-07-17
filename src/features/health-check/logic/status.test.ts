// Unit tests for the D-STATUS-BOUNDARIES wear-status model (FRAMEWORK_RULES Rule 6.2 primary
// target; HEALTH_ACCEPTANCE.md AC-1 and AC-3 are the exact test oracle for the fixtures below).
// Pure logic only — no React, no Supabase (Rule 1.3), matches the module under test.

import { describe, expect, it } from '@jest/globals';

import {
  axisResultsForItem,
  clampProgress,
  computeProgress,
  statusForItem,
  statusFromProgress,
  worseStatus,
  worstAxisResult,
  type ServiceItemAxes,
  type VehicleOdometer,
} from './status';

// A fixed "now" so time-axis fixtures are deterministic regardless of when the suite runs.
const NOW = new Date('2026-07-17T12:00:00.000Z');

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const emptyAxes: ServiceItemAxes = {
  interval_km: null,
  interval_days: null,
  interval_events: null,
  last_service_km: null,
  last_service_at: null,
  events_elapsed: 0,
};

describe('computeProgress', () => {
  it('computes (current - lastService) / interval', () => {
    expect(computeProgress(1625, 0, 2500)).toBeCloseTo(0.65, 10);
    expect(computeProgress(2500, 0, 2500)).toBe(1);
    expect(computeProgress(3750, 0, 2500)).toBe(1.5);
  });

  it('returns 0 for a non-positive interval instead of dividing by zero/negative', () => {
    expect(computeProgress(100, 0, 0)).toBe(0);
    expect(computeProgress(100, 0, -5)).toBe(0);
  });

  it('is axis-agnostic — identical formula regardless of what current/lastService/interval represent', () => {
    // km axis
    expect(computeProgress(1625, 0, 2500)).toBeCloseTo(0.65, 10);
    // days axis (elapsed days vs baseline 0, interval in days)
    expect(computeProgress(712, 0, 1095)).toBeCloseTo(712 / 1095, 10);
    // event-count axis (elapsed events vs baseline 0, interval in events)
    expect(computeProgress(1, 0, 2)).toBe(0.5);
  });
});

describe('statusFromProgress — D-STATUS-BOUNDARIES (AC-1 exact boundary matrix)', () => {
  // AC-1 fixture: interval=2500 km, last_service_km=0.
  // current -> progress -> expected status. Boundary values belong to the lower-severity state.
  const table: [current: number, expectedProgress: number, expected: string][] = [
    [1625, 0.65, 'fresh'], // exactly 65.0% -> Fresh (boundary belongs to lower severity)
    [1626, 0.6504, 'due_soon'], // 65.04% -> Due soon
    [2250, 0.9, 'due_soon'], // exactly 90.0% -> Due soon (boundary belongs to lower severity)
    [2251, 0.9004, 'replace'], // 90.04% -> Replace
    [2500, 1.0, 'replace'], // exactly 100.0% -> Replace (boundary belongs to lower severity)
    [2501, 1.0004, 'overdue'], // 100.04% -> Overdue
    [3750, 1.5, 'overdue'], // 150% -> Overdue
  ];

  it.each(table)(
    'current=%i -> progress≈%p -> %s',
    (current: number, expectedProgress: number, expected: string) => {
      const progress = computeProgress(current, 0, 2500);
      expect(progress).toBeCloseTo(expectedProgress, 4);
      expect(statusFromProgress(progress)).toBe(expected);
    }
  );

  it('treats every boundary constant (0.65, 0.90, 1.00) as belonging to the lower-severity state', () => {
    expect(statusFromProgress(0.65)).toBe('fresh');
    expect(statusFromProgress(0.9)).toBe('due_soon');
    expect(statusFromProgress(1.0)).toBe('replace');
  });

  it('is strictly greater-than on every boundary for the next state up', () => {
    expect(statusFromProgress(0.6500001)).toBe('due_soon');
    expect(statusFromProgress(0.9000001)).toBe('replace');
    expect(statusFromProgress(1.0000001)).toBe('overdue');
  });

  it('applies identically on the time (days) axis at the same relative-progress values (AC-1)', () => {
    const relative: [number, string][] = [
      [0.65, 'fresh'],
      [0.66, 'due_soon'],
      [0.9, 'due_soon'],
      [0.91, 'replace'],
      [1.0, 'replace'],
      [1.01, 'overdue'],
    ];
    for (const [p, expected] of relative) {
      const elapsedDays = p * 1095;
      const progress = computeProgress(elapsedDays, 0, 1095);
      expect(statusFromProgress(progress)).toBe(expected);
    }
  });

  it('applies identically on the event-count axis at the same relative-progress values (AC-1)', () => {
    const relative: [number, string][] = [
      [0.65, 'fresh'],
      [0.66, 'due_soon'],
      [0.9, 'due_soon'],
      [0.91, 'replace'],
      [1.0, 'replace'],
      [1.01, 'overdue'],
    ];
    for (const [p, expected] of relative) {
      const elapsedEvents = p * 2; // interval_events = 2, matching Oil Filter (AC-3)
      const progress = computeProgress(elapsedEvents, 0, 2);
      expect(statusFromProgress(progress)).toBe(expected);
    }
  });
});

describe('worseStatus — dual-axis worst-of-two (D-OQ-H3-TIME-DUAL-AXIS)', () => {
  it('orders severity overdue > replace > due_soon > fresh', () => {
    expect(worseStatus('fresh', 'due_soon')).toBe('due_soon');
    expect(worseStatus('due_soon', 'fresh')).toBe('due_soon');
    expect(worseStatus('due_soon', 'replace')).toBe('replace');
    expect(worseStatus('replace', 'overdue')).toBe('overdue');
    expect(worseStatus('overdue', 'fresh')).toBe('overdue');
  });

  it('a distance-axis Fresh + time-axis Overdue combination resolves to Overdue overall (AC-1)', () => {
    expect(worseStatus('fresh', 'overdue')).toBe('overdue');
  });

  it('is symmetric and idempotent for equal statuses', () => {
    expect(worseStatus('replace', 'replace')).toBe('replace');
    expect(worseStatus('fresh', 'fresh')).toBe('fresh');
  });
});

describe('clampProgress', () => {
  it('clamps to [0, 1] — the meter never renders past 100% (D-STATUS-BOUNDARIES)', () => {
    expect(clampProgress(1.5)).toBe(1);
    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(0.5)).toBe(0.5);
    expect(clampProgress(1)).toBe(1);
    expect(clampProgress(0)).toBe(0);
  });
});

describe('axisResultsForItem — full pipeline against AC-1 fixtures', () => {
  it('km axis: Fresh at 65.0% with remaining = 875 km (AC-1)', () => {
    const item: ServiceItemAxes = { ...emptyAxes, interval_km: 2500, last_service_km: 0 };
    const vehicle: VehicleOdometer = { current_odometer_km: 1625 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result).toMatchObject({ axis: 'km', status: 'fresh', remaining: 875 });
    expect(result?.progress).toBeCloseTo(0.65, 10);
  });

  it('km axis: Due soon at 65.04% with remaining = 874 km (AC-1)', () => {
    const item: ServiceItemAxes = { ...emptyAxes, interval_km: 2500, last_service_km: 0 };
    const vehicle: VehicleOdometer = { current_odometer_km: 1626 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result).toMatchObject({ axis: 'km', status: 'due_soon', remaining: 874 });
  });

  it('km axis: Overdue at 100.04% with remaining = -1 km (1 km overdue, AC-1)', () => {
    const item: ServiceItemAxes = { ...emptyAxes, interval_km: 2500, last_service_km: 0 };
    const vehicle: VehicleOdometer = { current_odometer_km: 2501 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result).toMatchObject({ axis: 'km', status: 'overdue', remaining: -1 });
  });

  it('km axis: 150% progress is Overdue and progress is left unclamped for the caller to clamp', () => {
    const item: ServiceItemAxes = { ...emptyAxes, interval_km: 2500, last_service_km: 0 };
    const vehicle: VehicleOdometer = { current_odometer_km: 3750 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result?.status).toBe('overdue');
    expect(result?.progress).toBe(1.5);
    expect(clampProgress(result?.progress ?? 0)).toBe(1);
  });

  it('days axis: uses now() vs last_service_at over interval_days', () => {
    const item: ServiceItemAxes = {
      ...emptyAxes,
      interval_days: 1095,
      last_service_at: daysAgo(900),
    };
    const vehicle: VehicleOdometer = { current_odometer_km: 0 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result?.axis).toBe('days');
    expect(result?.status).toBe('due_soon'); // 900/1095 = 82.2%
    expect(result?.progress).toBeCloseTo(900 / 1095, 6);
  });

  it('events axis: uses events_elapsed over interval_events, baseline always 0', () => {
    const item: ServiceItemAxes = { ...emptyAxes, interval_events: 2, events_elapsed: 1 };
    const vehicle: VehicleOdometer = { current_odometer_km: 0 };
    const [result] = axisResultsForItem(item, vehicle, NOW);
    expect(result).toMatchObject({ axis: 'events', status: 'fresh', remaining: 1 });
    expect(result?.progress).toBe(0.5);
  });

  it('an axis is only included when both its interval AND baseline are known', () => {
    // interval_km set but last_service_km unknown (null) -> km axis not tracked yet.
    const item: ServiceItemAxes = { ...emptyAxes, interval_km: 2500, last_service_km: null };
    const vehicle: VehicleOdometer = { current_odometer_km: 1625 };
    expect(axisResultsForItem(item, vehicle, NOW)).toHaveLength(0);
  });

  it('an item can carry multiple axes at once (dual-axis)', () => {
    const item: ServiceItemAxes = {
      ...emptyAxes,
      interval_km: 2500,
      last_service_km: 0,
      interval_days: 1095,
      last_service_at: daysAgo(900),
    };
    const vehicle: VehicleOdometer = { current_odometer_km: 1625 };
    const results = axisResultsForItem(item, vehicle, NOW);
    expect(results.map((r) => r.axis).sort()).toEqual(['days', 'km']);
  });
});

describe('worstAxisResult', () => {
  it('returns undefined for an empty result set', () => {
    expect(worstAxisResult([])).toBeUndefined();
  });

  it('picks the most severe axis (dual-axis worst-of-two, never averaged)', () => {
    const results = [
      { axis: 'km' as const, progress: 0.4, status: 'fresh' as const, remaining: 1500 },
      { axis: 'days' as const, progress: 1.2, status: 'overdue' as const, remaining: -200 },
    ];
    expect(worstAxisResult(results)?.axis).toBe('days');
    expect(worstAxisResult(results)?.status).toBe('overdue');
  });

  it('never averages progress across axes when picking the worst', () => {
    // Average of (0.4, 1.2) would be 0.8 -> due_soon, but the correct answer is overdue.
    const results = [
      { axis: 'km' as const, progress: 0.4, status: 'fresh' as const, remaining: 1500 },
      { axis: 'days' as const, progress: 1.2, status: 'overdue' as const, remaining: -200 },
    ];
    const worst = worstAxisResult(results);
    expect(worst?.status).toBe('overdue');
    expect(worst?.status).not.toBe(statusFromProgress((0.4 + 1.2) / 2));
  });

  it('tie-breaks toward the more urgent (smaller/most-negative remaining) axis on equal status', () => {
    const results = [
      { axis: 'km' as const, progress: 1.3, status: 'overdue' as const, remaining: -50 },
      { axis: 'days' as const, progress: 1.6, status: 'overdue' as const, remaining: -300 },
    ];
    expect(worstAxisResult(results)?.axis).toBe('days');
  });
});

describe('statusForItem — overall status wired through axisResultsForItem + worstAxisResult', () => {
  it('a dual-axis item where distance reads Fresh and time reads Overdue resolves Overdue overall (AC-1)', () => {
    const item: ServiceItemAxes = {
      ...emptyAxes,
      interval_km: 2500,
      last_service_km: 24500, // (25000-24500)/2500 = 20% -> Fresh
      interval_days: 30,
      last_service_at: daysAgo(45), // 45/30 = 150% -> Overdue
    };
    const vehicle: VehicleOdometer = { current_odometer_km: 25000 };
    expect(statusForItem(item, vehicle, NOW)).toBe('overdue');
  });

  it('an item with no configured axis is treated as fresh', () => {
    expect(statusForItem(emptyAxes, { current_odometer_km: 25000 }, NOW)).toBe('fresh');
  });
});

describe('AC-3 — Oil Filter event-count axis sequence (D-OQ-H9-OIL-FILTER-SEEDING)', () => {
  const vehicle: VehicleOdometer = { current_odometer_km: 25000 };
  const oilFilterAxes = (eventsElapsed: number): ServiceItemAxes => ({
    ...emptyAxes,
    interval_events: 2,
    events_elapsed: eventsElapsed,
  });

  it('0 of 2 events elapsed -> progress 0%, Fresh', () => {
    expect(statusForItem(oilFilterAxes(0), vehicle, NOW)).toBe('fresh');
    const [axis] = axisResultsForItem(oilFilterAxes(0), vehicle, NOW);
    expect(axis?.progress).toBe(0);
  });

  it('1 of 2 events elapsed (1st Engine Oil mark-done) -> progress 50%, Fresh', () => {
    expect(statusForItem(oilFilterAxes(1), vehicle, NOW)).toBe('fresh');
    const [axis] = axisResultsForItem(oilFilterAxes(1), vehicle, NOW);
    expect(axis?.progress).toBe(0.5);
  });

  it('2 of 2 events elapsed (2nd Engine Oil mark-done) -> progress 100%, Replace', () => {
    expect(statusForItem(oilFilterAxes(2), vehicle, NOW)).toBe('replace');
    const [axis] = axisResultsForItem(oilFilterAxes(2), vehicle, NOW);
    expect(axis?.progress).toBe(1);
  });

  it('3 of 2 events elapsed (3rd Engine Oil mark-done, filter not replaced) -> progress 150%, Overdue', () => {
    expect(statusForItem(oilFilterAxes(3), vehicle, NOW)).toBe('overdue');
    const [axis] = axisResultsForItem(oilFilterAxes(3), vehicle, NOW);
    expect(axis?.progress).toBe(1.5);
  });

  it('marking Oil Filter itself replaced resets its own counter to 0 independently of Engine Oil km baseline', () => {
    // Oil Filter's own counter resets to 0 -> Fresh, regardless of Engine Oil's km-based item.
    expect(statusForItem(oilFilterAxes(0), vehicle, NOW)).toBe('fresh');
  });
});
