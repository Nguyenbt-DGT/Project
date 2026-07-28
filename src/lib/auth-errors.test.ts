// getAuthErrorMessage hides @supabase/auth-js's raw-fetch-Response dump on 5xx errors (see the
// module doc comment) behind a generic, localized message; 4xx errors pass through as-is since
// they're genuinely readable ("Invalid login credentials", etc.).

import { describe, expect, it } from '@jest/globals';

import { getAuthErrorMessage } from './auth-errors';

describe('getAuthErrorMessage', () => {
  it('returns empty string for no error', () => {
    expect(getAuthErrorMessage(null, 'en')).toBe('');
    expect(getAuthErrorMessage(undefined, 'en')).toBe('');
  });

  it('passes through a readable 4xx message unchanged', () => {
    expect(getAuthErrorMessage({ message: 'Invalid login credentials', status: 400 }, 'en')).toBe(
      'Invalid login credentials'
    );
  });

  it('replaces a 5xx message (even a garbled raw-Response dump) with a generic English message', () => {
    const garbled = '{"type":"default","status":500,"ok":false,"_bodyBlob":{"blobId":"x"}}';
    expect(getAuthErrorMessage({ message: garbled, status: 500 }, 'en')).toBe(
      'Something went wrong on our server. Please try again in a moment.'
    );
  });

  it('replaces a 5xx message with the Vietnamese generic message when language is vi', () => {
    expect(getAuthErrorMessage({ message: 'anything', status: 502 }, 'vi')).toBe(
      'Đã có lỗi ở máy chủ. Vui lòng thử lại sau ít phút.'
    );
  });

  it('treats a missing status as retryable/unknown (generic message), matching AuthUnknownError', () => {
    expect(getAuthErrorMessage({ message: 'some unknown error' }, 'en')).toBe(
      'Something went wrong on our server. Please try again in a moment.'
    );
  });
});
