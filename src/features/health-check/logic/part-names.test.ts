// Unit tests for part-name translation (DEMO_FEEDBACK_003 #1). No React, no Supabase (Rule 1.3).

import { describe, expect, it } from '@jest/globals';

import { resolvePartName } from './part-names';

const ALL_DEFAULT_TYPE_KEYS = [
  'chain_lube',
  'engine_oil',
  'oil_filter',
  'front_brake_pads',
  'rear_brake_pads',
  'spark_plug',
  'chain',
  'tires',
  'air_filter',
  'fuel_filter',
  'coolant',
  'brake_fluid',
  'clutch_plates',
];

describe('resolvePartName', () => {
  it('returns the English fallback verbatim when language is "en"', () => {
    expect(resolvePartName('engine_oil', 'Engine oil', 'en')).toBe('Engine oil');
  });

  it('returns the Vietnamese translation for a known default part when language is "vi"', () => {
    expect(resolvePartName('engine_oil', 'Engine oil', 'vi')).toBe('Nhớt máy');
    expect(resolvePartName('tires', 'Tires', 'vi')).toBe('Lốp xe');
  });

  it('falls back to the stored name for an unknown/custom type_key, even in Vietnamese (Rule 8.3 extensibility)', () => {
    expect(resolvePartName('custom_led_light', 'LED headlight', 'vi')).toBe('LED headlight');
  });

  it('every one of the 13 seeded default parts has a Vietnamese translation', () => {
    for (const typeKey of ALL_DEFAULT_TYPE_KEYS) {
      const translated = resolvePartName(typeKey, 'FALLBACK_SHOULD_NOT_APPEAR', 'vi');
      expect(translated).not.toBe('FALLBACK_SHOULD_NOT_APPEAR');
      expect(translated.length).toBeGreaterThan(0);
    }
  });
});
