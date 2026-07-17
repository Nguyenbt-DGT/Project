// String-key + fallback-English-text map for Health-tab copy (HEALTH_REQ §5 for status wording).
// D-HEALTH-MVP-SCOPE refinement: i18n is deferred, but screens must reference these keys/constants
// rather than inline text so wiring in a real i18n framework later is a swap, not a rewrite. No
// React, no Supabase imports (Rule 1.3).

import type { MetricStatus } from './status';

export interface LabelDefinition {
  key: string;
  /** English fallback text shown until a real i18n framework is wired in. */
  fallback: string;
}

function label(key: string, fallback: string): LabelDefinition {
  return { key, fallback };
}

/** One entry per MetricStatus — the word/message wording from HEALTH_REQ §5. `{value}` is
 * replaced with the formatted remaining/overdue amount for due_soon/overdue; fresh/replace ignore
 * it (their wording has no dynamic amount). */
export const STATUS_LABELS: Record<MetricStatus, LabelDefinition> = {
  fresh: label('health.status_label.fresh', 'Fresh'),
  due_soon: label('health.status_label.due_soon', 'Due in {value}'),
  replace: label('health.status_label.replace', 'This part needs to be replaced/repaired'),
  overdue: label('health.status_label.overdue', 'Overdue {value} — replace/repair as soon as possible'),
};

/** Resolve a status's fallback message, substituting `value` for the "{value}" placeholder, e.g.
 * `formatStatusLabel('due_soon', '874 km')` -> `"Due in 874 km"` (HEALTH_ACCEPTANCE AC-1). */
export function formatStatusLabel(status: MetricStatus, value: string): string {
  return STATUS_LABELS[status].fallback.replace('{value}', value);
}

/** Caption shown under the meter regardless of status (e.g. "875 km remaining"), satisfying
 * HEALTH_REQ §5's "Fresh + remaining km/mi" — remaining is always visible, not just on Fresh. */
export function formatRemainingCaption(value: string): string {
  return `${value} remaining`;
}

export const HEALTH_LABELS = {
  vehicle: {
    loadError: label('health.vehicle.load_error', 'Could not load your vehicle.'),
    emptyTitle: label('health.vehicle.empty_title', 'No vehicle yet'),
    emptyBody: label(
      'health.vehicle.empty_body',
      'Complete onboarding to add your bike and start tracking its health.'
    ),
  },
  liveVitals: {
    title: label('health.live_vitals.title', 'Live Vitals'),
    odometer: label('health.live_vitals.odometer', 'Current odometer'),
    todaysDistance: label('health.live_vitals.todays_distance', "Today's distance"),
    gpsComingSoon: label(
      'health.live_vitals.gps_coming_soon',
      'GPS tracking coming soon — today’s distance reflects recorded trips only.'
    ),
  },
  serviceReminders: {
    title: label('health.service_reminders.title', 'Service Reminders'),
    runningTotal: label('health.service_reminders.running_total', 'Total price entered'),
    editOdometer: label('health.service_reminders.edit_odometer', 'Edit odometer'),
    markAsReplaced: label('health.service_reminders.mark_as_replaced', 'Mark as replaced'),
    empty: label('health.service_reminders.empty', 'No service items yet.'),
    error: label('health.service_reminders.error', 'Could not load service reminders.'),
    overdueIcon: label('health.service_reminders.overdue_icon', 'Overdue — needs attention'),
  },
  spend: {
    title: label('health.spend.title', 'Spent this year'),
    total: label('health.spend.total', 'Total'),
    topItems: label('health.spend.top_items', 'Top items'),
    empty: label('health.spend.empty', 'No spend recorded this year yet.'),
    error: label('health.spend.error', 'Could not load this year’s spend.'),
  },
  detail: {
    title: label('health.detail.title', 'Detail'),
    interval: label('health.detail.interval', 'Service interval'),
    lastServiceKm: label('health.detail.last_service_km', 'Last service (odometer)'),
    lastServiceAt: label('health.detail.last_service_at', 'Last service (date)'),
    price: label('health.detail.price', 'Price'),
    priceInputLabel: label('health.detail.price_input_label', 'Price paid (optional)'),
    pricePlaceholder: label('health.detail.price_placeholder', 'e.g. 30.00'),
    confirmMarkDone: label(
      'health.detail.confirm_mark_done',
      'Mark this item as replaced/serviced now?'
    ),
  },
  editOdometer: {
    title: label('health.edit_odometer.title', 'Edit odometer'),
    inputLabel: label('health.edit_odometer.input_label', 'Current odometer'),
    error: label('health.edit_odometer.error', 'Enter a valid, non-negative number.'),
  },
  common: {
    loading: label('health.common.loading', 'Loading…'),
    retry: label('health.common.retry', 'Retry'),
    save: label('health.common.save', 'Save'),
    cancel: label('health.common.cancel', 'Close'),
    error: label('health.common.error', 'Something went wrong.'),
  },
} as const;
