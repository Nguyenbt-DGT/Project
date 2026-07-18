// String-key + per-language text for Health-tab copy (HEALTH_REQ §5 for status wording).
// DEMO_FEEDBACK_002 #1: real English/Vietnamese switching. Each label carries its English
// (`fallback`) and Vietnamese (`vi`) text inline, so coverage is guaranteed at the type level and
// there's no separate key→translation map to drift. No React, no Supabase imports (Rule 1.3);
// `Language` is a type-only import (erased at runtime, so this stays a pure module).

import type { Language } from '@/i18n';

export interface LabelDefinition {
  key: string;
  /** English text (also the fallback when a translation is missing). */
  fallback: string;
  /** Vietnamese text. */
  vi: string;
}

function label(key: string, fallback: string, vi: string): LabelDefinition {
  return { key, fallback, vi };
}

/** Resolve a label to the given language (English is the fallback). */
export function resolveLabel(def: LabelDefinition, language: Language): string {
  return language === 'vi' ? def.vi : def.fallback;
}

/** One entry per MetricStatus — the word/message wording from HEALTH_REQ §5. `{value}` is replaced
 * with the formatted remaining/overdue amount for due_soon/overdue. */
export const STATUS_LABELS: Record<'fresh' | 'due_soon' | 'replace' | 'overdue', LabelDefinition> =
  {
    fresh: label('health.status_label.fresh', 'Fresh', 'Tốt'),
    due_soon: label('health.status_label.due_soon', 'Due in {value}', 'Đến hạn sau {value}'),
    replace: label(
      'health.status_label.replace',
      'This part needs to be replaced/repaired',
      'Bộ phận này cần được thay/sửa'
    ),
    overdue: label(
      'health.status_label.overdue',
      'Overdue {value} — replace/repair as soon as possible',
      'Quá hạn {value} — hãy thay/sửa càng sớm càng tốt'
    ),
  };

const REMAINING_CAPTION = label('health.caption.remaining', '{value} remaining', 'còn lại {value}');

/** Resolve a status's message in the given language, substituting `value` for "{value}". */
export function formatStatusLabel(
  status: 'fresh' | 'due_soon' | 'replace' | 'overdue',
  value: string,
  language: Language = 'en'
): string {
  return resolveLabel(STATUS_LABELS[status], language).replace('{value}', value);
}

/** Caption shown under the meter regardless of status (e.g. "875 km remaining"). */
export function formatRemainingCaption(value: string, language: Language = 'en'): string {
  return resolveLabel(REMAINING_CAPTION, language).replace('{value}', value);
}

export const HEALTH_LABELS = {
  vehicle: {
    loadError: label(
      'health.vehicle.load_error',
      'Could not load your vehicle.',
      'Không thể tải xe của bạn.'
    ),
    emptyTitle: label('health.vehicle.empty_title', 'No vehicle yet', 'Chưa có xe'),
    emptyBody: label(
      'health.vehicle.empty_body',
      'Complete onboarding to add your bike and start tracking its health.',
      'Hoàn tất thiết lập để thêm xe và bắt đầu theo dõi tình trạng.'
    ),
  },
  liveVitals: {
    title: label('health.live_vitals.title', 'Live Vitals', 'Thông số trực tiếp'),
    odometer: label('health.live_vitals.odometer', 'Current odometer', 'Số km hiện tại'),
    todaysDistance: label(
      'health.live_vitals.todays_distance',
      "Today's distance",
      'Quãng đường hôm nay'
    ),
    gpsComingSoon: label(
      'health.live_vitals.gps_coming_soon',
      'GPS tracking coming soon — today’s distance reflects recorded trips only.',
      'Tính năng GPS sắp ra mắt — quãng đường hôm nay chỉ tính từ các chuyến đã ghi.'
    ),
  },
  serviceReminders: {
    title: label('health.service_reminders.title', 'Service Reminders', 'Nhắc bảo dưỡng'),
    runningTotal: label(
      'health.service_reminders.running_total',
      'Total price entered',
      'Tổng chi phí đã nhập'
    ),
    editOdometer: label('health.service_reminders.edit_odometer', 'Edit odometer', 'Sửa số km'),
    markAsReplaced: label(
      'health.service_reminders.mark_as_replaced',
      'Mark as replaced',
      'Đánh dấu đã thay'
    ),
    empty: label(
      'health.service_reminders.empty',
      'No service items yet.',
      'Chưa có mục bảo dưỡng nào.'
    ),
    error: label(
      'health.service_reminders.error',
      'Could not load service reminders.',
      'Không thể tải nhắc bảo dưỡng.'
    ),
    overdueIcon: label(
      'health.service_reminders.overdue_icon',
      'Overdue — needs attention',
      'Quá hạn — cần chú ý'
    ),
    confirmTitle: label(
      'health.service_reminders.confirm_title',
      'Mark as replaced',
      'Đánh dấu đã thay'
    ),
    confirmBody: label(
      'health.service_reminders.confirm_body',
      'Mark this part as replaced/serviced',
      'Đánh dấu bộ phận này đã thay/bảo dưỡng'
    ),
    markedToast: label(
      'health.service_reminders.marked_toast',
      'marked as replaced',
      'đã được đánh dấu là đã thay'
    ),
    undoneToast: label('health.service_reminders.undone_toast', 'restored', 'đã được khôi phục'),
    markFailed: label(
      'health.service_reminders.mark_failed',
      'Could not mark this item as replaced. Please try again.',
      'Không thể đánh dấu mục này. Vui lòng thử lại.'
    ),
    undoFailed: label(
      'health.service_reminders.undo_failed',
      'Could not undo. Please try again.',
      'Không thể hoàn tác. Vui lòng thử lại.'
    ),
    odometerFailed: label(
      'health.service_reminders.odometer_failed',
      'Could not update the odometer. Please try again.',
      'Không thể cập nhật số km. Vui lòng thử lại.'
    ),
  },
  spend: {
    title: label('health.spend.title', 'Spent this year', 'Chi tiêu năm nay'),
    total: label('health.spend.total', 'Total', 'Tổng'),
    topItems: label('health.spend.top_items', 'Top items', 'Các mục cao nhất'),
    empty: label(
      'health.spend.empty',
      'No spend recorded this year yet.',
      'Chưa ghi nhận chi tiêu nào trong năm.'
    ),
    error: label(
      'health.spend.error',
      'Could not load this year’s spend.',
      'Không thể tải chi tiêu năm nay.'
    ),
    viewDetails: label(
      'health.spend.view_details',
      'Tap to view all entries',
      'Chạm để xem tất cả'
    ),
    detailsTitle: label('health.spend.details_title', 'Spend details', 'Chi tiết chi tiêu'),
    kindParts: label('health.spend.kind_parts', 'Parts', 'Phụ tùng'),
    kindService: label('health.spend.kind_service', 'Service', 'Dịch vụ'),
  },
  detail: {
    title: label('health.detail.title', 'Detail', 'Chi tiết'),
    interval: label('health.detail.interval', 'Service interval', 'Chu kỳ bảo dưỡng'),
    lastServiceKm: label(
      'health.detail.last_service_km',
      'Last service (odometer)',
      'Lần bảo dưỡng gần nhất (số km)'
    ),
    lastServiceAt: label(
      'health.detail.last_service_at',
      'Last service (date)',
      'Lần bảo dưỡng gần nhất (ngày)'
    ),
    price: label('health.detail.price', 'Price', 'Giá'),
    priceInputLabel: label(
      'health.detail.price_input_label',
      'Price paid (optional)',
      'Giá đã trả (tuỳ chọn)'
    ),
    pricePlaceholder: label('health.detail.price_placeholder', 'e.g. 30.00', 'vd. 30.00'),
    confirmMarkDone: label(
      'health.detail.confirm_mark_done',
      'Mark this item as replaced/serviced now?',
      'Đánh dấu mục này đã thay/bảo dưỡng ngay?'
    ),
    setLastServiceLabel: label(
      'health.detail.set_last_service_label',
      'Last service (odometer)',
      'Lần bảo dưỡng gần nhất (số km)'
    ),
    setLastServiceHelp: label(
      'health.detail.set_last_service_help',
      'Next service is counted from this odometer value.',
      'Lần bảo dưỡng kế tiếp được tính từ mốc số km này.'
    ),
    setLastServiceSave: label(
      'health.detail.set_last_service_save',
      'Save last service',
      'Lưu mốc bảo dưỡng'
    ),
    setLastServiceError: label(
      'health.detail.set_last_service_error',
      'Enter a value between 0 and the current odometer.',
      'Nhập giá trị từ 0 đến số km hiện tại.'
    ),
  },
  vehicleEdit: {
    entryLabel: label('health.vehicle_edit.entry_label', 'Edit vehicle', 'Sửa thông tin xe'),
    title: label('health.vehicle_edit.title', 'Edit vehicle', 'Sửa thông tin xe'),
    error: label(
      'health.vehicle_edit.error',
      'Could not save vehicle info. Please try again.',
      'Không thể lưu thông tin xe. Vui lòng thử lại.'
    ),
    validation: label('health.vehicle_edit.validation', 'Enter a bike name.', 'Nhập tên xe.'),
  },
  editOdometer: {
    title: label('health.edit_odometer.title', 'Edit odometer', 'Sửa số km'),
    inputLabel: label('health.edit_odometer.input_label', 'Current odometer', 'Số km hiện tại'),
    error: label(
      'health.edit_odometer.error',
      'Enter a valid, non-negative number.',
      'Nhập một số hợp lệ, không âm.'
    ),
  },
  common: {
    loading: label('health.common.loading', 'Loading…', 'Đang tải…'),
    retry: label('health.common.retry', 'Retry', 'Thử lại'),
    save: label('health.common.save', 'Save', 'Lưu'),
    cancel: label('health.common.cancel', 'Close', 'Đóng'),
    error: label('health.common.error', 'Something went wrong.', 'Đã có lỗi xảy ra.'),
    yes: label('health.common.yes', 'Yes', 'Có'),
    no: label('health.common.no', 'No', 'Không'),
    undo: label('health.common.undo', 'Undo', 'Hoàn tác'),
    language: label('health.common.language', 'Language', 'Ngôn ngữ'),
  },
  onboarding: {
    brand: label('health.onboarding.brand', 'NIGHT GARAGE', 'NIGHT GARAGE'),
    title: label('health.onboarding.title', 'Set up your bike', 'Thiết lập xe của bạn'),
    subtitle: label(
      'health.onboarding.subtitle',
      'A few details so we can track its health.',
      'Vài thông tin để theo dõi tình trạng xe.'
    ),
    language: label('health.onboarding.language', 'Language', 'Ngôn ngữ'),
    nameLabel: label('health.onboarding.name_label', 'Bike name', 'Tên xe'),
    namePlaceholder: label(
      'health.onboarding.name_placeholder',
      'e.g. My Daily Rider',
      'vd. Xe đi hằng ngày'
    ),
    brandLabel: label('health.onboarding.brand_label', 'Brand', 'Hãng'),
    brandPlaceholder: label('health.onboarding.brand_placeholder', 'e.g. Honda', 'vd. Honda'),
    mileageLabel: label('health.onboarding.mileage_label', 'Current mileage', 'Số km hiện tại'),
    unitLabel: label('health.onboarding.unit_label', 'Unit', 'Đơn vị'),
    recentlyChanged: label(
      'health.onboarding.recently_changed',
      'Recently changed parts',
      'Bộ phận vừa thay gần đây'
    ),
    recentlyChangedHint: label(
      'health.onboarding.recently_changed_hint',
      'Tick the parts you serviced recently — they start fresh (0%).',
      'Chọn các bộ phận bạn vừa bảo dưỡng — chúng bắt đầu ở mức mới (0%).'
    ),
    submit: label('health.onboarding.submit', 'Start tracking', 'Bắt đầu theo dõi'),
    error: label(
      'health.onboarding.error',
      'Could not save your bike. Please try again.',
      'Không thể lưu xe. Vui lòng thử lại.'
    ),
    validation: label(
      'health.onboarding.validation',
      'Enter a bike name and a valid mileage.',
      'Nhập tên xe và số km hợp lệ.'
    ),
  },
  permission: {
    title: label('health.permission.title', 'Location access', 'Quyền vị trí'),
    body: label(
      'health.permission.body',
      'Moto Companion uses your location to record rides and keep your odometer up to date. You can change this anytime in Settings.',
      'Moto Companion dùng vị trí để ghi lại hành trình và cập nhật số km. Bạn có thể thay đổi trong Cài đặt bất cứ lúc nào.'
    ),
    grant: label('health.permission.grant', 'Allow location', 'Cho phép vị trí'),
    dismiss: label('health.permission.dismiss', 'Not now', 'Để sau'),
    denied: label(
      'health.permission.denied',
      'Location is off — ride recording is unavailable until you enable it in Settings.',
      'Vị trí đang tắt — không thể ghi hành trình cho đến khi bật trong Cài đặt.'
    ),
  },
} as const;
