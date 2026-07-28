import type { Language } from '@/i18n';

/**
 * Supabase's auth-js treats any 5xx response as a "retryable network error" and skips parsing the
 * response body entirely — it stringifies the raw fetch Response object as `.message` (see
 * @supabase/auth-js `lib/fetch.js` `_getErrorMessage`/`handleError`). That produces an unreadable
 * JSON dump of internal fetch/Response fields if shown directly to a user. 4xx errors (invalid
 * credentials, weak password, user already registered, etc.) DO have a genuinely readable
 * `.message` and are safe to show as-is.
 */
export function getAuthErrorMessage(
  error: { message: string; status?: number } | null | undefined,
  language: Language
): string {
  if (!error) return '';
  if (!error.status || error.status >= 500) {
    return language === 'vi'
      ? 'Đã có lỗi ở máy chủ. Vui lòng thử lại sau ít phút.'
      : 'Something went wrong on our server. Please try again in a moment.';
  }
  return error.message;
}
