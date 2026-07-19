// Pure "which parts are overdue, worst first" derivation for the Home warning card
// (HOME_REQ.md / DEMO_FEEDBACK_005 #7). No React, no Supabase (Rule 1.3).
//
// Deep-imports health-check's `logic/status`, `logic/labels`, `logic/part-names`, `logic/units`
// directly rather than through its screen-bearing index.ts — the same documented Rule 1.2
// carve-out already used by `health-score.ts` (see `D-HOME-DEEP-IMPORT`). Reusing
// `formatStatusLabel('overdue', ...)` means the wording here is byte-for-byte the same "Overdue
// {value} — replace/repair as soon as possible" copy already shown on the Health tab, instead of
// a second, easily-drifting copy of the same message.

import { formatStatusLabel } from '@/features/health-check/logic/labels';
import { resolvePartName } from '@/features/health-check/logic/part-names';
import {
  axisResultsForItem,
  worstAxisResult,
  type ServiceItemAxes,
  type VehicleOdometer,
} from '@/features/health-check/logic/status';
import { formatDistance, type DistanceUnit } from '@/features/health-check/logic/units';
import type { Language } from '@/i18n';

export interface OverduePartRow extends ServiceItemAxes {
  id: string;
  type_key: string;
  name: string;
}

export interface OverduePart {
  id: string;
  name: string;
  message: string;
}

function axisValueDisplay(
  magnitude: number,
  axis: 'km' | 'days' | 'events',
  unit: DistanceUnit
): string {
  const rounded = Math.round(magnitude);
  switch (axis) {
    case 'km':
      return formatDistance(magnitude, unit);
    case 'days':
      return `${rounded} day${rounded === 1 ? '' : 's'}`;
    case 'events':
      return `${rounded} event${rounded === 1 ? '' : 's'}`;
  }
}

/** Every item whose overall status is `overdue`, worst (most overdue) first. */
export function computeOverdueParts(
  items: OverduePartRow[],
  vehicle: VehicleOdometer,
  now: Date,
  unit: DistanceUnit,
  language: Language
): OverduePart[] {
  const overdue: { item: OverduePartRow; remaining: number; message: string }[] = [];

  for (const item of items) {
    const driving = worstAxisResult(axisResultsForItem(item, vehicle, now));
    if (!driving || driving.status !== 'overdue') continue;

    const valueDisplay = axisValueDisplay(Math.abs(driving.remaining), driving.axis, unit);
    overdue.push({
      item,
      remaining: driving.remaining, // negative once overdue; more negative = more overdue
      message: formatStatusLabel('overdue', valueDisplay, language),
    });
  }

  overdue.sort((a, b) => a.remaining - b.remaining);

  return overdue.map(({ item, message }) => ({
    id: item.id,
    name: resolvePartName(item.type_key, item.name, language),
    message,
  }));
}
