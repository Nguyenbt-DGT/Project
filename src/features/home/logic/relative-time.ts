// Pure relative-time formatting for the Home hero card's "last ride" caption (HOME_REQ.md
// §3.1 mockup wording: "2 nights ago"). No React, no Supabase (Rule 1.3); `Language` is a
// type-only import.

import type { Language } from '@/i18n';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * `formatNightsAgo(rideDate, now, 'en')` -> "Today" / "Yesterday" / "3 nights ago", based on
 * calendar-day difference (device-local), not raw elapsed hours — riding at 11pm and checking the
 * app at 1am the same "night" should still read "Today", not "1 night ago".
 */
export function formatNightsAgo(date: Date, now: Date, language: Language): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays <= 0) return language === 'vi' ? 'Hôm nay' : 'Today';
  if (diffDays === 1) return language === 'vi' ? 'Hôm qua' : 'Yesterday';
  return language === 'vi' ? `${diffDays} đêm trước` : `${diffDays} nights ago`;
}
