// Vietnamese translations for the default part catalog (DEMO_FEEDBACK_003 #1). Part names come
// from the database (service_items.name / part_type_defaults.name), stored in English only —
// translating them at the source would fight Rule 8.3 (metrics are extensible rows, not enums), so
// translation happens here, keyed by the well-known type_key of the 13 seeded default parts.
// Custom/user-added parts (unknown type_key) fall back to whatever name was stored for them.
//
// NOTE: these are draft/reasonable Vietnamese motorcycle-maintenance terms, not verified by a
// native speaker — flag for business-analyst review before this ships to real Vietnamese users
// (same caveat as HEALTH_REQ's other AI-drafted content).

import type { Language } from '@/i18n';

const PART_NAME_VI: Record<string, string> = {
  chain_lube: 'Bôi trơn xích',
  engine_oil: 'Nhớt máy',
  oil_filter: 'Lọc nhớt',
  front_brake_pads: 'Má phanh trước',
  rear_brake_pads: 'Má phanh sau',
  spark_plug: 'Bugi',
  chain: 'Xích tải',
  tires: 'Lốp xe',
  air_filter: 'Lọc gió',
  fuel_filter: 'Lọc nhiên liệu',
  coolant: 'Nước làm mát',
  brake_fluid: 'Dầu phanh',
  clutch_plates: 'Lá côn',
};

/**
 * Resolve a part's display name in the given language. `fallbackName` is the name stored in the
 * database (English) — used verbatim for unknown type_keys (custom parts) and whenever the
 * language is English.
 */
export function resolvePartName(typeKey: string, fallbackName: string, language: Language): string {
  if (language === 'vi') {
    return PART_NAME_VI[typeKey] ?? fallbackName;
  }
  return fallbackName;
}
