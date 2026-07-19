// Pure "Spent this year" logic (HEALTH_REQ §7, D-OQ-H5-SPEND-YEAR, D-YEAR-BOUNDARY-TZ). No React,
// no Supabase imports (Rule 1.3).

import type { Language } from '@/i18n';

import { HEALTH_LABELS, resolveLabel } from './labels';
import { resolvePartName } from './part-names';

export interface SpendEntryLike {
  amount_cents: number;
  /** Postgres `date` column — always "YYYY-MM-DD", no time/timezone component. */
  spent_at: string;
}

interface SpendEntryNameLike {
  part_type_key: string | null;
  note: string | null;
  /** DB constraint restricts this to 'parts' | 'service' at write time, but the generated
   * `Tables<'spend_entries'>` type widens check-constraint columns to plain `string`. */
  kind: string;
}

function humanizePartTypeKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Best-available label for a spend entry. A recognized part_type_key (translatable) takes
 * priority over the free-text note — DEMO_FEEDBACK_004 #2: every seeded/typical entry has an
 * English note ("Chain replacement", etc.), and note-first ordering meant the translated part name
 * never actually rendered. The user's own note text is still shown as a secondary caption
 * wherever this entry's row has room for one (see SpendDetailsSheet), it's just no longer the
 * PRIMARY label when a translatable part name is available. Lives here (not in a component file)
 * because both spend-summary-section.tsx and spend-details-sheet.tsx need it and having either
 * import it from the other created a require cycle.
 */
export function displayName(entry: SpendEntryNameLike, language: Language): string {
  if (entry.part_type_key) {
    return resolvePartName(entry.part_type_key, humanizePartTypeKey(entry.part_type_key), language);
  }
  if (entry.note && entry.note.trim() !== '') return entry.note;
  return resolveLabel(
    entry.kind === 'service' ? HEALTH_LABELS.spend.kindService : HEALTH_LABELS.spend.kindParts,
    language
  );
}

function yearOf(spentAt: string): number {
  // Read the year directly out of the "YYYY-MM-DD" string rather than via `new Date(...)`, which
  // parses date-only strings as UTC midnight and can shift the apparent local year near a
  // timezone's day boundary. spent_at already IS the calendar day the spend belongs to.
  return Number(spentAt.slice(0, 4));
}

/** Entries whose spent_at falls within `now`'s calendar year, device-local (D-YEAR-BOUNDARY-TZ).
 * Pass a `Date` representing the user's current device-local time. */
export function currentYearEntries<T extends SpendEntryLike>(entries: T[], now: Date): T[] {
  const year = now.getFullYear();
  return entries.filter((entry) => yearOf(entry.spent_at) === year);
}

export function spendTotalCents(entries: SpendEntryLike[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount_cents, 0);
}

/** Highest-cost entries first, capped at `n` (top 3 per HEALTH_REQ §7). Ties keep input order
 * (stable sort). */
export function topNSpend<T extends SpendEntryLike>(entries: T[], n = 3): T[] {
  return [...entries].sort((a, b) => b.amount_cents - a.amount_cents).slice(0, n);
}

/** Today's date as "YYYY-MM-DD" in device-local time — use when writing a new spend_entries row
 * so its calendar day matches the rider's own clock (D-YEAR-BOUNDARY-TZ) rather than the DB
 * server's `current_date` default, which may be a different timezone. */
export function localDateString(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
