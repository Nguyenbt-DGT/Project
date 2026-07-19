// Unit tests for the Home hero card's relative-time caption. No React, no Supabase (Rule 1.3).

import { describe, expect, it } from '@jest/globals';

import { formatNightsAgo } from './relative-time';

const now = new Date('2026-01-10T09:00:00.000Z');

describe('formatNightsAgo', () => {
  it('same calendar day -> "Today"', () => {
    expect(formatNightsAgo(new Date('2026-01-10T02:00:00.000Z'), now, 'en')).toBe('Today');
  });

  it('previous calendar day -> "Yesterday", regardless of exact hour difference', () => {
    // Only ~10 hours apart in raw time, but crosses a calendar-day boundary -> still "Yesterday".
    expect(formatNightsAgo(new Date('2026-01-09T23:00:00.000Z'), now, 'en')).toBe('Yesterday');
  });

  it('N days back -> "N nights ago"', () => {
    expect(formatNightsAgo(new Date('2026-01-08T09:00:00.000Z'), now, 'en')).toBe('2 nights ago');
  });

  it('Vietnamese equivalents', () => {
    expect(formatNightsAgo(new Date('2026-01-10T02:00:00.000Z'), now, 'vi')).toBe('Hôm nay');
    expect(formatNightsAgo(new Date('2026-01-09T23:00:00.000Z'), now, 'vi')).toBe('Hôm qua');
    expect(formatNightsAgo(new Date('2026-01-08T09:00:00.000Z'), now, 'vi')).toBe('2 đêm trước');
  });
});
