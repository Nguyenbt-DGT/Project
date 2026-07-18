// Health-screen styling tokens. The palette itself is the shared app theme (@/theme, the
// "Night Garage" look); this module re-exports it and adds the feature's 4-state wear-status
// mapping (fresh/due_soon/replace/overdue), typed against MetricStatus.

import { STATUS_PALETTE, STATUS_SOFT_PALETTE } from '@/theme';

import type { MetricStatus } from '../logic/status';

export { COLORS, SPACING, RADIUS } from '@/theme';

export const STATUS_COLORS: Record<MetricStatus, string> = STATUS_PALETTE;
export const STATUS_SOFT_COLORS: Record<MetricStatus, string> = STATUS_SOFT_PALETTE;
