// Unit tests for language-aware currency formatting/parsing (DEMO_FEEDBACK_004 #1). No React, no
// Supabase (Rule 1.3).

import { describe, expect, it } from '@jest/globals';

import { currencyForLanguage, formatCurrency, parseCurrencyToCents } from './currency';

describe('currencyForLanguage', () => {
  it('maps vi -> vnd, en -> usd', () => {
    expect(currencyForLanguage('vi')).toBe('vnd');
    expect(currencyForLanguage('en')).toBe('usd');
  });
});

describe('formatCurrency', () => {
  it('formats English as USD with cents', () => {
    expect(formatCurrency(3000, 'en')).toBe('$30.00');
    expect(formatCurrency(0, 'en')).toBe('$0.00');
  });

  it('formats Vietnamese as VND, rounded to the nearest 1,000, period-grouped', () => {
    // 3000 cents = $30 * 25000 = 750,000 VND exactly.
    expect(formatCurrency(3000, 'vi')).toBe('750.000 ₫');
    // 8000 cents = $80 -> 2,000,000 VND.
    expect(formatCurrency(8000, 'vi')).toBe('2.000.000 ₫');
  });
});

describe('parseCurrencyToCents', () => {
  it('parses a plain USD decimal in English', () => {
    expect(parseCurrencyToCents('30', 'en')).toBe(3000);
    expect(parseCurrencyToCents('30.00', 'en')).toBe(3000);
  });

  it('parses a VND amount in Vietnamese, tolerating period-grouped digits', () => {
    expect(parseCurrencyToCents('750000', 'vi')).toBe(3000);
    expect(parseCurrencyToCents('750.000', 'vi')).toBe(3000);
  });

  it('round-trips through format -> parse back to the same canonical cents', () => {
    const original = 8000; // $80
    const displayed = formatCurrency(original, 'vi'); // "2.000.000 ₫"
    const digitsOnly = displayed.replace(/[^\d]/g, '');
    expect(parseCurrencyToCents(digitsOnly, 'vi')).toBe(original);
  });

  it('returns null for empty, negative, or non-numeric input', () => {
    expect(parseCurrencyToCents('', 'en')).toBeNull();
    expect(parseCurrencyToCents('  ', 'vi')).toBeNull();
    expect(parseCurrencyToCents('-5', 'en')).toBeNull();
    expect(parseCurrencyToCents('abc', 'vi')).toBeNull();
  });
});
