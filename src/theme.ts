// Shared app theme — "Night Garage" (design/prototype/Night Garage.html, design/images/health.png).
// A dark, warm near-black canvas with a bright orange accent and a lime-green "healthy" status.
// App-level screens (tab bar, auth, onboarding) and feature code both import from here so the whole
// app shares one palette. Feature-specific status mappings live in the feature's own theme module.

export const COLORS = {
  bg: '#0c0705', // --bg: warm near-black canvas
  surface: '#17100c', // --card
  surfaceMuted: '#1f150e',
  border: '#2a1d13',
  borderStrong: '#3a2819',
  ink: '#f6ece4', // --tx: warm off-white
  inkMuted: '#b09a8c', // --mut
  inkFaint: '#7a675b', // --faint: uppercase tracked section labels
  accent: '#ff6a2b', // --amber: brand orange
  accentStrong: '#ff4d2e', // --hot
  accentSoft: 'rgba(255,106,43,0.14)',
  accentInk: '#140803', // dark ink for text on an orange fill
};

// 4-state wear palette (green -> amber -> orange -> hot red), matching the image's status cues.
export const STATUS_PALETTE = {
  fresh: '#8fd07a', // --good
  due_soon: '#ffb04a',
  replace: '#ff6a2b', // --amber
  overdue: '#ff4d2e', // --hot
} as const;

export const STATUS_SOFT_PALETTE = {
  fresh: 'rgba(143,208,122,0.14)',
  due_soon: 'rgba(255,176,74,0.16)',
  replace: 'rgba(255,106,43,0.16)',
  overdue: 'rgba(255,77,46,0.16)',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const RADIUS = { sm: 8, md: 12, lg: 14 };
