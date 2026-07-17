// Pure business logic for HEALTH_CHECK wear-status computation (Rule 1.3: no React, no Supabase
// imports). Boundary semantics are fixed by D-STATUS-BOUNDARIES in docs/DECISIONS.md — do not
// change without a new decision entry.

/** KB §2.3 / FRAMEWORK_RULES Rule 2.4 — the four wear states, increasing in severity. */
export type MetricStatus = 'fresh' | 'due_soon' | 'replace' | 'overdue';

const SEVERITY: Record<MetricStatus, number> = {
  fresh: 0,
  due_soon: 1,
  replace: 2,
  overdue: 3,
};

/**
 * progress = (current − lastService) / interval, unclamped (can exceed 1 once overdue).
 * Axis-agnostic: pass whichever axis's own current/baseline/interval values (km, elapsed days,
 * or event count) — the formula and boundaries are identical on every axis (D-OQ-H3-TIME-DUAL-AXIS).
 */
export function computeProgress(current: number, lastService: number, interval: number): number {
  if (interval <= 0) {
    return 0;
  }
  return (current - lastService) / interval;
}

/**
 * D-STATUS-BOUNDARIES, ratified word-for-word:
 *   p <= 0.65        -> fresh
 *   0.65 < p <= 0.90  -> due_soon
 *   0.90 < p <= 1.00  -> replace
 *   p > 1.00          -> overdue
 * Each boundary value belongs to the lower-severity state.
 */
export function statusFromProgress(p: number): MetricStatus {
  if (p <= 0.65) return 'fresh';
  if (p <= 0.9) return 'due_soon';
  if (p <= 1.0) return 'replace';
  return 'overdue';
}

/** Worst (most severe) of two statuses — dual-axis items take the worst, never a sum/average
 * (D-OQ-H3-TIME-DUAL-AXIS). */
export function worseStatus(a: MetricStatus, b: MetricStatus): MetricStatus {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/** Clamp a progress ratio to the 0..1 range the wear meter renders — past 100% the bar stays
 * visually full (D-STATUS-BOUNDARIES). */
export function clampProgress(p: number): number {
  return Math.max(0, Math.min(1, p));
}

/**
 * The minimal shape statusForItem/axisResultsForItem need from a service_items row, kept
 * structural (not imported from database.types.ts) so this module stays a pure, Supabase-free
 * unit (Rule 1.3) that QA can test with plain fixture objects.
 */
export interface ServiceItemAxes {
  interval_km: number | null;
  interval_days: number | null;
  interval_events: number | null;
  last_service_km: number | null;
  last_service_at: string | null;
  events_elapsed: number;
}

export interface VehicleOdometer {
  current_odometer_km: number;
}

export type Axis = 'km' | 'days' | 'events';

export interface AxisResult {
  axis: Axis;
  progress: number;
  status: MetricStatus;
  /** interval − elapsed on this axis; negative once overdue (e.g. "874 km remaining" or
   * "-1 km" i.e. 1 km overdue — callers display Math.abs(remaining)). */
  remaining: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Per-axis progress/status/remaining for whichever axes this item actually tracks. An axis is
 * included only when its interval is configured AND its baseline is known — an item can carry
 * 1-3 axes at once (KB §2.3 dual-axis items, e.g. a part tracked by both km and time).
 */
export function axisResultsForItem(
  item: ServiceItemAxes,
  vehicle: VehicleOdometer,
  now: Date
): AxisResult[] {
  const results: AxisResult[] = [];

  if (item.interval_km != null && item.last_service_km != null) {
    const elapsed = vehicle.current_odometer_km - item.last_service_km;
    const progress = computeProgress(vehicle.current_odometer_km, item.last_service_km, item.interval_km);
    results.push({
      axis: 'km',
      progress,
      status: statusFromProgress(progress),
      remaining: item.interval_km - elapsed,
    });
  }

  if (item.interval_days != null && item.last_service_at != null) {
    const elapsedDays = (now.getTime() - new Date(item.last_service_at).getTime()) / MS_PER_DAY;
    const progress = computeProgress(elapsedDays, 0, item.interval_days);
    results.push({
      axis: 'days',
      progress,
      status: statusFromProgress(progress),
      remaining: item.interval_days - elapsedDays,
    });
  }

  if (item.interval_events != null) {
    const progress = computeProgress(item.events_elapsed, 0, item.interval_events);
    results.push({
      axis: 'events',
      progress,
      status: statusFromProgress(progress),
      remaining: item.interval_events - item.events_elapsed,
    });
  }

  return results;
}

/** The single axis that should drive the card's displayed status/progress/remaining: the most
 * severe axis, tie-broken toward the more urgent (smaller/most-negative remaining) one. */
export function worstAxisResult(results: AxisResult[]): AxisResult | undefined {
  if (results.length === 0) {
    return undefined;
  }
  return results.reduce((worst, current) => {
    if (worseStatus(worst.status, current.status) !== worst.status) {
      return current;
    }
    if (current.status === worst.status && current.remaining < worst.remaining) {
      return current;
    }
    return worst;
  });
}

/** Overall status for a (possibly multi-axis) service item — worst of every tracked axis
 * (D-OQ-H3-TIME-DUAL-AXIS). An item with no configured axis is treated as fresh. */
export function statusForItem(item: ServiceItemAxes, vehicle: VehicleOdometer, now: Date): MetricStatus {
  return worstAxisResult(axisResultsForItem(item, vehicle, now))?.status ?? 'fresh';
}
