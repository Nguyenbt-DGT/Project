// Domain view types + DB-row -> view-model mapping for the Health screen (Rule 2.4: discriminated
// unions over booleans). This file MAY import the generated DB types (read-only, structural use)
// but stays React/Supabase-call-free — it only maps data, never fetches it.

import type { Language } from '@/i18n';
import type { Tables } from '@/types/database.types';

import { formatRemainingCaption, formatStatusLabel } from './logic/labels';
import { resolvePartName } from './logic/part-names';
import {
  axisResultsForItem,
  clampProgress,
  worstAxisResult,
  type AxisResult,
  type MetricStatus,
} from './logic/status';
import { formatDistance, type DistanceUnit } from './logic/units';

export type ServiceItemRow = Tables<'service_items'>;
export type VehicleRow = Tables<'vehicles'>;
export type SpendEntryRow = Tables<'spend_entries'>;

/** Per-service-item view model consumed by the Service Reminders cards/detail view. */
export interface ServiceItemViewModel {
  id: string;
  typeKey: string;
  name: string;
  status: MetricStatus;
  /** 0..1, clamped — the wear meter never renders past 100% (D-STATUS-BOUNDARIES). */
  progressClamped: number;
  /** Full status sentence, e.g. "Due in 874 km" / "Fresh" / "Overdue 1 km — replace/repair as
   * soon as possible" (HEALTH_REQ §5). */
  displayLabel: string;
  /** Secondary caption shown under the meter regardless of status, e.g. "875 km remaining". Empty
   * string when the item has no configured axis. */
  remainingCaption: string;
  isOverdue: boolean;
  priceCents: number | null;
  intervalKm: number | null;
  intervalDays: number | null;
  intervalEvents: number | null;
  lastServiceKm: number | null;
  lastServiceAt: string | null;
  eventsElapsed: number;
}

function axisValueDisplay(axis: AxisResult, unit: DistanceUnit): string {
  const magnitude = Math.abs(axis.remaining);
  switch (axis.axis) {
    case 'km':
      return formatDistance(magnitude, unit);
    case 'days': {
      const days = Math.round(magnitude);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
    case 'events': {
      const events = Math.round(magnitude);
      return `${events} event${events === 1 ? '' : 's'}`;
    }
    default:
      return '';
  }
}

/**
 * Derive a service item's display view model from its DB row + the vehicle it belongs to. Status,
 * progress and the driving axis all come from `logic/status.ts`; formatting comes from
 * `logic/units.ts` and `logic/labels.ts` — this function only wires them together.
 */
export function toServiceItemViewModel(
  row: ServiceItemRow,
  vehicle: VehicleRow,
  now: Date,
  unit: DistanceUnit,
  language: Language = 'en'
): ServiceItemViewModel {
  const axisResults = axisResultsForItem(row, vehicle, now);
  const driving = worstAxisResult(axisResults);
  const status = driving?.status ?? 'fresh';
  const progressClamped = driving ? clampProgress(driving.progress) : 0;
  const valueDisplay = driving ? axisValueDisplay(driving, unit) : '';

  return {
    id: row.id,
    typeKey: row.type_key,
    name: resolvePartName(row.type_key, row.name, language),
    status,
    progressClamped,
    displayLabel: formatStatusLabel(status, valueDisplay, language),
    remainingCaption: valueDisplay ? formatRemainingCaption(valueDisplay, language) : '',
    isOverdue: status === 'overdue',
    priceCents: row.price_cents,
    intervalKm: row.interval_km,
    intervalDays: row.interval_days,
    intervalEvents: row.interval_events,
    lastServiceKm: row.last_service_km,
    lastServiceAt: row.last_service_at,
    eventsElapsed: row.events_elapsed,
  };
}
