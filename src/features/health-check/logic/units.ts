// Pure km/mi conversion + display-rounding logic (HEALTH_REQ §8, D-UNIT-ROUNDING). No React, no
// Supabase imports (Rule 1.3).

export type DistanceUnit = 'km' | 'mi';

const KM_TO_MI_FACTOR = 0.621371;
const MI_TO_KM_FACTOR = 1.609344;

export function kmToMi(km: number): number {
  return km * KM_TO_MI_FACTOR;
}

export function miToKm(mi: number): number {
  return mi * MI_TO_KM_FACTOR;
}

/** Narrow a DB `unit_preference` string ('km' | 'mi' by schema constraint, HEALTH_REQ §8) to the
 * literal type, defaulting to 'km' for any unrecognized value — defensive only, since the value is
 * constrained server-side. */
export function toDistanceUnit(value: string): DistanceUnit {
  return value === 'mi' ? 'mi' : 'km';
}

/**
 * Whole-unit rounded display string in the given unit, no decimals (D-UNIT-ROUNDING), e.g.
 * `formatDistance(40355, 'mi')` -> `"25,076 mi"`. Canonical storage is always km; this is
 * presentation-only and never writes anything.
 */
export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = unit === 'mi' ? kmToMi(km) : km;
  const rounded = Math.round(value);
  return `${rounded.toLocaleString('en-US')} ${unit}`;
}

/** Convert a manually-entered miles value to the whole-km value that gets persisted
 * (D-UNIT-ROUNDING: rounded to the nearest whole km before storage), e.g.
 * `roundKmForStorage(100)` -> `161` (100 × 1.609344 = 160.9344). */
export function roundKmForStorage(miValue: number): number {
  return Math.round(miToKm(miValue));
}
