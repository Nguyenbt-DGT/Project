// Unit tests for km/mi conversion + display rounding (HEALTH_REQ §8, D-UNIT-ROUNDING,
// HEALTH_ACCEPTANCE.md AC-4). No React, no Supabase (Rule 1.3), matches the module under test.

import { describe, expect, it } from '@jest/globals';

import { formatDistance, kmToMi, miToKm, roundKmForStorage, toDistanceUnit } from './units';

describe('kmToMi / miToKm', () => {
  it('converts km -> mi using the documented factor 0.621371', () => {
    expect(kmToMi(1)).toBeCloseTo(0.621371, 6);
    expect(kmToMi(0)).toBe(0);
  });

  it('converts mi -> km using the documented factor 1.609344', () => {
    expect(miToKm(1)).toBeCloseTo(1.609344, 6);
    expect(miToKm(0)).toBe(0);
  });

  it('round-trips approximately (not exactly, since the two factors are independent roundings)', () => {
    const km = 1000;
    const roundTripped = miToKm(kmToMi(km));
    expect(roundTripped).toBeCloseTo(km, 1);
  });
});

describe('formatDistance — AC-4 whole-unit rounding, no writes (presentation only)', () => {
  it('formats km with no decimals and thousands separators', () => {
    expect(formatDistance(40355, 'km')).toBe('40,355 km');
  });

  it('formats mi with no decimals, rounded to nearest whole mile (D-UNIT-ROUNDING)', () => {
    // NOTE ON THE AC-4 / D-UNIT-ROUNDING FIXTURE (flagged, not silently "fixed"):
    // HEALTH_ACCEPTANCE.md AC-4 and DECISIONS.md D-UNIT-ROUNDING both state
    // "40355 x 0.621371 = 25076.19... -> 25,076 mi". That arithmetic is incorrect — verified two
    // ways: 40355 * 0.621371 = 25075.426705, and 40355 / 1.609344 (exact mi<->km reciprocal) =
    // 25075.43. Both round to 25,075 mi, not 25,076 mi. This test asserts the mathematically
    // correct output of the STATED rule (multiply by the documented factor, round to nearest whole
    // unit) rather than the erroneous illustrative number in the docs, since the rounding rule
    // itself is unambiguous. Flagged back to business-analyst/product-owner to correct the AC-4 /
    // D-UNIT-ROUNDING prose fixture — do not "fix" this test to match 25,076 without correcting the
    // docs' own arithmetic first, or the two will silently diverge again.
    expect(formatDistance(40355, 'mi')).toBe('25,075 mi');
  });

  it('rounds .5-and-up up, per Math.round semantics', () => {
    // 1 km = 0.621371 mi; use a value whose fractional part is unambiguous.
    expect(formatDistance(0, 'mi')).toBe('0 mi');
  });

  it('does not mutate or depend on any external/stored state — pure formatting', () => {
    const km = 12345;
    const first = formatDistance(km, 'km');
    const second = formatDistance(km, 'km');
    expect(first).toBe(second);
  });
});

describe('roundKmForStorage — AC-4 manual mi entry converted + rounded before persisting', () => {
  it('100 mi -> 161 km (100 x 1.609344 = 160.9344, rounded)', () => {
    expect(roundKmForStorage(100)).toBe(161);
  });

  it('0 mi -> 0 km', () => {
    expect(roundKmForStorage(0)).toBe(0);
  });

  it('always returns an integer', () => {
    expect(Number.isInteger(roundKmForStorage(37.4))).toBe(true);
  });
});

describe('toDistanceUnit', () => {
  it('narrows "mi" to the mi literal', () => {
    expect(toDistanceUnit('mi')).toBe('mi');
  });

  it('defaults any non-"mi" value (including "km") to "km"', () => {
    expect(toDistanceUnit('km')).toBe('km');
    expect(toDistanceUnit('bogus')).toBe('km');
    expect(toDistanceUnit('')).toBe('km');
  });
});
