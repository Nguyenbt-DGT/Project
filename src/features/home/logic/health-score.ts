// Pure "bike health" aggregation for the HOME tab (HOME_REQ.md §3/§4, DEMO_FEEDBACK_004 #4). No
// React, no Supabase (Rule 1.3). Reuses health-check's exact wear-status math so the Home score
// can never drift from what the Health tab itself shows per part.
//
// Deep-imports `logic/status` rather than going through `@/features/health-check`'s index.ts —
// FRAMEWORK_RULES Rule 1.2's documented carve-out for pure logic modules. Re-exporting this from
// the barrel would force this file to transitively load HealthCheckScreen (and its native
// Ionicons/expo-font chain) just to reach a handful of dependency-free math functions.
//
// HOME_REQ leaves both the score formula and the per-status message wording explicitly up to us
// ("The content of each status I let you decide") — documented as D-HOME-HEALTH-SCORE.

import {
  axisResultsForItem,
  clampProgress,
  worseStatus,
  worstAxisResult,
  type MetricStatus,
  type ServiceItemAxes,
  type VehicleOdometer,
} from '@/features/health-check/logic/status';

export interface HealthScoreResult {
  /** 0..100 — 100 = every tracked item at 0% of its interval, 0 = maximally overdue everywhere. */
  score: number;
  /** Worst status across every tracked item — the same four-state vocabulary as the Health tab
   * (Part status), per HOME_REQ §4.2.2. */
  status: MetricStatus;
}

/**
 * Average clamped progress across every item that has at least one configured axis, inverted into
 * a 0..100 "freshness" score, paired with the worst individual item's status (never averaged —
 * one badly overdue part should never get diluted into a falsely-reassuring color, consistent
 * with how dual-axis items already take the worse of their own axes).
 */
export function computeHealthScore(
  items: ServiceItemAxes[],
  vehicle: VehicleOdometer,
  now: Date
): HealthScoreResult {
  let totalClampedProgress = 0;
  let consideredCount = 0;
  let worst: MetricStatus = 'fresh';

  for (const item of items) {
    const driving = worstAxisResult(axisResultsForItem(item, vehicle, now));
    if (!driving) continue;
    totalClampedProgress += clampProgress(driving.progress);
    worst = worseStatus(worst, driving.status);
    consideredCount += 1;
  }

  if (consideredCount === 0) {
    return { score: 100, status: 'fresh' };
  }

  const avgProgress = totalClampedProgress / consideredCount;
  const score = Math.max(0, Math.min(100, Math.round((1 - avgProgress) * 100)));
  return { score, status: worst };
}
