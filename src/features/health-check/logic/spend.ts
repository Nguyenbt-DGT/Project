// Pure "Spent this year" logic (HEALTH_REQ §7, D-OQ-H5-SPEND-YEAR, D-YEAR-BOUNDARY-TZ). No React,
// no Supabase imports (Rule 1.3).

export interface SpendEntryLike {
  amount_cents: number;
  /** Postgres `date` column — always "YYYY-MM-DD", no time/timezone component. */
  spent_at: string;
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
