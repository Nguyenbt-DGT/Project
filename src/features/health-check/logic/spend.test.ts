// Unit tests for the "Spent this year" logic (HEALTH_REQ §7, D-OQ-H5-SPEND-YEAR,
// D-YEAR-BOUNDARY-TZ). HEALTH_ACCEPTANCE.md AC-6 is the exact test oracle for the fixtures below.
// No React, no Supabase (Rule 1.3), matches the module under test.

import { describe, expect, it } from '@jest/globals';

import {
  currentYearEntries,
  localDateString,
  spendTotalCents,
  topNSpend,
  type SpendEntryLike,
} from './spend';

// AC-6 fixture: Tires $150, Chain $80, Brake pads $45, Engine oil $30 (this calendar year), plus
// one prior-year entry that must be excluded from totals/top-3 but never deleted.
const tires: SpendEntryLike = { amount_cents: 15000, spent_at: '2026-06-01' };
const chain: SpendEntryLike = { amount_cents: 8000, spent_at: '2026-05-15' };
const brakePads: SpendEntryLike = { amount_cents: 4500, spent_at: '2026-03-20' };
const engineOil: SpendEntryLike = { amount_cents: 3000, spent_at: '2026-01-10' };
const priorYear: SpendEntryLike = { amount_cents: 5000, spent_at: '2025-11-01' };

const allEntries = [tires, chain, brakePads, engineOil, priorYear];
const NOW_2026 = new Date('2026-07-17T12:00:00.000Z');

describe('currentYearEntries — device-local calendar year filter (AC-6, D-YEAR-BOUNDARY-TZ)', () => {
  it('includes only entries whose spent_at falls in the current calendar year', () => {
    const result = currentYearEntries(allEntries, NOW_2026);
    expect(result).toHaveLength(4);
    expect(result).toEqual([tires, chain, brakePads, engineOil]);
  });

  it('excludes a prior-calendar-year entry without deleting it from the source array', () => {
    const result = currentYearEntries(allEntries, NOW_2026);
    expect(result).not.toContain(priorYear);
    expect(allEntries).toContain(priorYear); // source untouched — retained, not deleted (AC-6)
  });

  it('Jan 1 device-local reset: with only prior-year entries, returns an empty array', () => {
    // Built from local Date components (not a UTC ISO string near midnight) so this assertion is
    // stable regardless of the test runner's timezone — a UTC string like
    // "2027-01-01T00:00:01Z" would resolve to Dec 31 2026 local time in any negative-UTC-offset
    // zone (e.g. America/New_York), which is exactly the class of bug D-YEAR-BOUNDARY-TZ exists
    // to avoid; the test must not reintroduce it.
    const jan1 = new Date(2027, 0, 1, 0, 0, 1);
    const onlyOldEntries = [tires, chain, brakePads, engineOil, priorYear]; // all dated 2026 or earlier
    expect(currentYearEntries(onlyOldEntries, jan1)).toEqual([]);
  });

  it('reads the year from the date string directly, not via UTC-parsing new Date() (avoids TZ shift)', () => {
    // A spent_at of "2026-12-31" must count as 2026 even though `new Date("2026-12-31")` parses as
    // UTC midnight, which could read back as Dec 30 in a negative-UTC-offset local time — the
    // module deliberately avoids that trap (see spend.ts yearOf comment).
    const dec31: SpendEntryLike = { amount_cents: 100, spent_at: '2026-12-31' };
    expect(currentYearEntries([dec31], NOW_2026)).toEqual([dec31]);
  });
});

describe('spendTotalCents — AC-6 total = $305 including the 4th (non-top-3) entry', () => {
  it('sums all four current-year entries to 30500 cents ($305)', () => {
    const currentYear = currentYearEntries(allEntries, NOW_2026);
    expect(spendTotalCents(currentYear)).toBe(30500);
  });

  it('sums an empty array to 0 (Jan-1 reset -> Total = $0)', () => {
    expect(spendTotalCents([])).toBe(0);
  });

  it('does not silently include prior-year entries in the total', () => {
    // Guards against a caller passing the raw unfiltered array by accident.
    expect(spendTotalCents(allEntries)).toBe(35500); // includes the prior-year $50 too
    expect(spendTotalCents(currentYearEntries(allEntries, NOW_2026))).toBe(30500);
  });
});

describe('topNSpend — AC-6 top-3 = [Tires, Chain, Brake pads], excludes the 4th (Engine oil)', () => {
  it('returns the 3 highest-cost entries in descending order by default', () => {
    const currentYear = currentYearEntries(allEntries, NOW_2026);
    expect(topNSpend(currentYear)).toEqual([tires, chain, brakePads]);
  });

  it('excludes Engine oil ($30), the 4th-highest, from the top-3', () => {
    const currentYear = currentYearEntries(allEntries, NOW_2026);
    expect(topNSpend(currentYear)).not.toContain(engineOil);
  });

  it('empty on Jan-1 reset (no current-year entries)', () => {
    expect(topNSpend([])).toEqual([]);
  });

  it('respects a custom n', () => {
    const currentYear = currentYearEntries(allEntries, NOW_2026);
    expect(topNSpend(currentYear, 1)).toEqual([tires]);
    expect(topNSpend(currentYear, 10)).toEqual([tires, chain, brakePads, engineOil]);
  });

  it('does not mutate the input array (returns a new sorted array)', () => {
    const currentYear = currentYearEntries(allEntries, NOW_2026);
    const original = [...currentYear];
    topNSpend(currentYear);
    expect(currentYear).toEqual(original);
  });

  it('keeps input order for tied amounts (stable sort)', () => {
    const a: SpendEntryLike = { amount_cents: 1000, spent_at: '2026-01-01' };
    const b: SpendEntryLike = { amount_cents: 1000, spent_at: '2026-01-02' };
    expect(topNSpend([a, b])).toEqual([a, b]);
  });
});

describe('localDateString — device-local YYYY-MM-DD used when writing a new spend entry', () => {
  it('formats as zero-padded YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 0, 5); // Jan 5 2026, local time, month is 0-indexed
    expect(localDateString(d)).toBe('2026-01-05');
  });

  it('pads single-digit months and days', () => {
    const d = new Date(2026, 8, 9); // Sep 9 2026
    expect(localDateString(d)).toBe('2026-09-09');
  });

  it('does not shift across a UTC day boundary (uses local getters, not toISOString)', () => {
    const d = new Date(2026, 11, 31, 23, 30); // Dec 31 2026, 23:30 local
    expect(localDateString(d)).toBe('2026-12-31');
  });
});
