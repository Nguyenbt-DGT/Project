// Styling tokens for the Health screen. Colors are taken from design/mockup/app-ui.html's light
// palette (surfaces/ink/accent) plus the dataviz skill's validated fixed status palette
// (good/warning/serious/critical), extended to this feature's 4-state wear model:
//   fresh -> good, due_soon -> warning, replace -> serious, overdue -> critical.
// The mockup only defines a 3-state status palette (ok/warning/overdue) — HEALTH_REQ §5's 4-state
// model (fresh/due_soon/replace/overdue) needs a 4th distinct color, so this borrows the dataviz
// skill's reserved status palette instead of inventing one. Dark-mode theming is not implemented
// yet (no ThemeProvider exists elsewhere in the app) — light mode only, out of scope for this build.

import type { MetricStatus } from '../logic/status';

export const COLORS = {
  bg: '#F4F6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EAEEEA',
  border: '#D7DFDA',
  borderStrong: '#BFC9C3',
  ink: '#16211D',
  inkMuted: '#4B5A54',
  inkFaint: '#5C6B65',
  accent: '#0D6E74',
  accentStrong: '#085055',
  accentSoft: '#E3F1F0',
  accentInk: '#FFFFFF',
};

export const STATUS_COLORS: Record<MetricStatus, string> = {
  fresh: '#0ca30c',
  due_soon: '#fab219',
  replace: '#ec835a',
  overdue: '#d03b3b',
};

export const STATUS_SOFT_COLORS: Record<MetricStatus, string> = {
  fresh: 'rgba(12,163,12,0.12)',
  due_soon: 'rgba(250,178,25,0.16)',
  replace: 'rgba(236,131,90,0.16)',
  overdue: 'rgba(208,59,59,0.14)',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const RADIUS = { sm: 8, md: 12, lg: 14 };
