// Unit tests for Health-tab status wording (HEALTH_REQ §5, HEALTH_ACCEPTANCE.md AC-1). No React,
// no Supabase (Rule 1.3), matches the module under test.

import { describe, expect, it } from '@jest/globals';

import { formatRemainingCaption, formatStatusLabel, HEALTH_LABELS, STATUS_LABELS } from './labels';

describe('formatStatusLabel — per-status wording (AC-1)', () => {
  it('fresh: "Fresh", ignoring any value passed in', () => {
    expect(formatStatusLabel('fresh', '875 km')).toBe('Fresh');
  });

  it('due_soon: "Due in {value}" -> "Due in 874 km" (AC-1 exact fixture)', () => {
    expect(formatStatusLabel('due_soon', '874 km')).toBe('Due in 874 km');
  });

  it('replace: fixed message regardless of value (AC-1 exact fixture)', () => {
    expect(formatStatusLabel('replace', '0 km')).toBe(
      'This part needs to be replaced/repaired'
    );
  });

  it('overdue: "Overdue {value} — ..." -> "Overdue 1 km — replace/repair as soon as possible" (AC-1 exact fixture)', () => {
    expect(formatStatusLabel('overdue', '1 km')).toBe(
      'Overdue 1 km — replace/repair as soon as possible'
    );
  });

  it('substitutes only the first "{value}" placeholder occurrence', () => {
    expect(STATUS_LABELS.due_soon.fallback).toContain('{value}');
    expect(formatStatusLabel('due_soon', '2 days')).toBe('Due in 2 days');
  });
});

describe('formatRemainingCaption', () => {
  it('appends " remaining" to the given value (AC-1: "875 km" -> "875 km remaining")', () => {
    expect(formatRemainingCaption('875 km')).toBe('875 km remaining');
  });

  it('works for non-km axes too', () => {
    expect(formatRemainingCaption('2 events')).toBe('2 events remaining');
    expect(formatRemainingCaption('30 days')).toBe('30 days remaining');
  });
});

describe('STATUS_LABELS / HEALTH_LABELS — string-key contract (D-HEALTH-MVP-SCOPE i18n refinement)', () => {
  it('has exactly one label definition per MetricStatus literal', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(
      ['due_soon', 'fresh', 'overdue', 'replace'].sort()
    );
  });

  it('every label has a non-empty string key and fallback (screens reference keys, not inline text)', () => {
    for (const def of Object.values(STATUS_LABELS)) {
      expect(def.key.length).toBeGreaterThan(0);
      expect(def.fallback.length).toBeGreaterThan(0);
    }
  });

  it('HEALTH_LABELS groups are all key/fallback pairs, no inline hardcoded text objects', () => {
    const groups = Object.values(HEALTH_LABELS);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      for (const def of Object.values(group)) {
        expect(def).toHaveProperty('key');
        expect(def).toHaveProperty('fallback');
      }
    }
  });
});
