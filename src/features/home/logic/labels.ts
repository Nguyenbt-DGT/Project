// String-key + per-language text for Home-tab copy (HOME_REQ.md). Uses the shared label utility
// from @/i18n (the same one health-check's labels.ts re-exports) rather than a local redefinition.
// No React, no Supabase (Rule 1.3).

import { label } from '@/i18n';

export const HOME_LABELS = {
  hero: {
    addPhotoHint: label('home.hero.add_photo_hint', 'Tap to add a photo', 'Chạm để thêm ảnh'),
    lastRide: label('home.hero.last_ride', 'Last ride', 'Chuyến đi gần nhất'),
    noRides: label('home.hero.no_rides', 'No rides recorded yet', 'Chưa có chuyến đi nào'),
    detailTitle: label('home.hero.detail_title', 'Vehicle details', 'Chi tiết xe'),
    brandLabel: label('home.hero.brand_label', 'Brand', 'Hãng'),
    modelLabel: label('home.hero.model_label', 'Model', 'Dòng xe'),
    photoUploadFailed: label(
      'home.hero.photo_upload_failed',
      'Could not upload photo. Please try again.',
      'Không thể tải ảnh lên. Vui lòng thử lại.'
    ),
    photoTooLarge: label(
      'home.hero.photo_too_large',
      'That photo is too large — please choose one under 10 MB.',
      'Ảnh quá lớn — vui lòng chọn ảnh dưới 10 MB.'
    ),
  },
  stats: {
    totalDistance: label('home.stats.total_distance', 'Total distance', 'Tổng quãng đường'),
    thisMonth: label('home.stats.this_month', 'This month', 'Tháng này'),
    bikeHealth: label('home.stats.bike_health', 'Bike Health', 'Tình trạng xe'),
  },
  /** Per-status Bike Health message — HOME_REQ.md §4.2.3 leaves this entirely up to us
   * ("The content of each status I let you decide"), documented as D-HOME-HEALTH-SCORE. */
  statusMessage: {
    fresh: label(
      'home.status_message.fresh',
      'Running strong — nothing needs attention.',
      'Xe đang rất tốt — không có gì cần chú ý.'
    ),
    due_soon: label(
      'home.status_message.due_soon',
      'Mostly good — keep an eye on upcoming service.',
      'Khá tốt — chú ý các mốc bảo dưỡng sắp tới.'
    ),
    replace: label(
      'home.status_message.replace',
      'Running strong — one thing needs your wrench.',
      'Vẫn ổn — có một việc cần bạn sửa chữa.'
    ),
    overdue: label(
      'home.status_message.overdue',
      'Needs attention — something is overdue for service.',
      'Cần chú ý — có việc bảo dưỡng đã quá hạn.'
    ),
  },
  common: {
    close: label('home.common.close', 'Close', 'Đóng'),
  },
  /** Home-tab nav cards (HOME_REQ.md / Home-5th-session.png, DEMO_FEEDBACK_005 #8). */
  nav: {
    planARide: label('home.nav.plan_a_ride', 'Plan a Ride', 'Lên kế hoạch'),
    planARideCaption: label(
      'home.nav.plan_a_ride_caption',
      'Routes & camps',
      'Cung đường & điểm cắm trại'
    ),
    luckyDraw: label('home.nav.lucky_draw', 'Lucky Draw', 'Vòng Quay May Mắn'),
    luckyDrawCaption: label('home.nav.lucky_draw_caption', 'Let fate pick', 'Để may mắn dẫn lối'),
  },
} as const;
