// Language-aware currency formatting (DEMO_FEEDBACK_004 #1). Canonical storage stays USD cents
// everywhere (no schema change) — this module only converts for DISPLAY and for PARSING a
// user-typed amount back into canonical cents, the same "one canonical unit, convert at the edges"
// pattern already used for distance (units.ts, D-UNIT-ROUNDING). No React, no Supabase (Rule 1.3).

import type { Language } from '@/i18n';

export type Currency = 'usd' | 'vnd';

/**
 * Illustrative fixed rate, NOT a live/authoritative FX rate — there is no exchange-rate service
 * wired up (that would be a real product/business decision: which provider, how often it
 * refreshes, whether rates are locked at transaction time). Flagged in DECISIONS `D-DEMO4-CURRENCY`
 * for follow-up. 1 USD ≈ 25,000 VND is a round, easy-to-verify placeholder.
 */
const USD_TO_VND_RATE = 25000;

export function currencyForLanguage(language: Language): Currency {
  return language === 'vi' ? 'vnd' : 'usd';
}

function groupThousands(value: number): string {
  // Reuses the same toLocaleString('en-US') grouping trick as units.ts formatDistance (already
  // proven to work in this RN/Hermes setup), then swaps to the VND convention (period grouping,
  // no decimals) instead of pulling in a new Intl locale/dependency.
  return Math.round(value).toLocaleString('en-US').replace(/,/g, '.');
}

/**
 * Format canonical USD cents for display in the given language: `$30.00` in English, or a
 * VND-converted `750.000 ₫` in Vietnamese (rounded to the nearest 1,000 ₫ — nobody prices in
 * single dong). The stored value is never touched; this is presentation-only.
 */
export function formatCurrency(cents: number, language: Language): string {
  if (language === 'vi') {
    const vnd = Math.round((cents * USD_TO_VND_RATE) / 100 / 1000) * 1000;
    return `${groupThousands(vnd)} ₫`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse a user-typed amount, in the currency implied by `language`, into canonical USD cents.
 * Returns `null` when the input is empty or not a valid non-negative number — callers treat that
 * as "no price entered" (mirrors the existing mark-as-replaced behavior) or a validation error,
 * depending on context. Vietnamese input tolerates period-grouped digits (e.g. "750.000").
 */
export function parseCurrencyToCents(input: string, language: Language): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  if (language === 'vi') {
    const digitsOnly = trimmed.replace(/[.,\s]/g, '');
    const vnd = Number(digitsOnly);
    if (!Number.isFinite(vnd) || vnd < 0) return null;
    return Math.round((vnd / USD_TO_VND_RATE) * 100);
  }

  const usd = Number(trimmed);
  if (!Number.isFinite(usd) || usd < 0) return null;
  return Math.round(usd * 100);
}
