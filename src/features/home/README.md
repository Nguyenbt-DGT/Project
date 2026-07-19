# Feature: home ([HOME_REQ.md](../../../docs/HOME_REQ.md))

Status: **Implemented and tested through 2 rounds of demo feedback (DEMO_FEEDBACK_004 #4,
DEMO_FEEDBACK_005).** The landing tab, shown immediately after login/onboarding, leftmost in the
tab bar. Layout per FRAMEWORK_RULES §1 — same shape as health-check:

```
index.ts     Public API — the ONLY entry point for code outside this feature (Rule 1.2): HomeScreen
screens/     home-screen.tsx — composed screen rendered by the thin route in /app
components/  vehicle-hero-card, vehicle-hero-detail-sheet, stats-health-card, health-ring,
             overdue-parts-card, home-nav-cards
api/         useLastTrip, useMonthDistanceKm, pickVehiclePhoto, useUploadVehiclePhoto
i18n.ts      useT() — same pattern as health-check's, resolving against the app-wide language
logic/       PURE TypeScript business logic — no React, no Supabase (Rule 1.3)
```

**Reuses health-check's data and pure logic rather than duplicating it** — this feature has no
Supabase tables or business rules of its own beyond the vehicle photo:

- `useVehicle`, `useServiceItems`, `VEHICLE_QUERY_KEY` come from `@/features/health-check`'s public
  API (Rule 1.2).
- `logic/health-score.ts` and `logic/overdue-parts.ts` deep-import
  `@/features/health-check/logic/status` (+ `logic/labels`, `logic/part-names`, `logic/units`)
  directly — the documented exception to Rule 1.2 (pure, side-effect-free `logic/` modules may be
  deep-imported to avoid transitively loading a screen-bearing barrel; see `D-HOME-DEEP-IMPORT`).
  This guarantees Home can never disagree with what the Health tab itself shows per part, and reuses
  the exact translated overdue wording instead of a second copy of the same message.

`logic/` holds this feature's own pure business logic:

- **health-score.ts** — averages every tracked item's clamped progress into a 0–100 "freshness"
  score, paired with the **worst** individual item's status (never averaged/diluted). Both the
  formula and the per-status message wording are reasonable defaults HOME_REQ explicitly delegated
  to us ("the content of each status I let you decide") — see `D-HOME-HEALTH-SCORE`.
- **overdue-parts.ts** — every item whose overall status is `overdue`, worst first
  (DEMO_FEEDBACK_005 #7). Reuses health-check's exact `formatStatusLabel('overdue', ...)` copy.
- **relative-time.ts** — "Today" / "Yesterday" / "N nights ago" captions for the hero card's last
  ride, based on device-local calendar-day difference.
- **labels.ts** — Home-tab copy as `{key, fallback, vi}` triples, using the shared `label`/
  `resolveLabel` utility from `@/i18n` (the same one health-check's `logic/labels.ts` re-exports).

**Vehicle photo upload** (HOME_REQ §3.1.4): `pickVehiclePhoto()` (expo-image-picker) +
`useUploadVehiclePhoto()` upload to the `vehicle-photos` Supabase Storage bucket
(migration `20260719080000_home_vehicle_photo.sql`, owner-scoped RLS: path `{auth.uid()}/...`,
verified live) and point `vehicles.photo_url` at the result. Reads the local file through
`expo-file-system`'s `File` class (`.bytes()`/`.size`) — **not** `fetch().blob()`, which silently
produced unusable uploads on some RN runtimes (DEMO_FEEDBACK_005 #1, `D-DEMO5`). A 10 MB limit is
enforced client-side (`MAX_VEHICLE_PHOTO_BYTES`) in addition to the bucket's own server-side limit.

**Health score ring**: `health-ring.tsx` draws a true SVG progress ring (`react-native-svg`) — a
faint track circle plus a colored arc sized to the score, number centered. Only the arc carries the
status color (`D-HOME-HEALTH-SCORE`'s ring-vs-circle note).

**Overdue warning + nav cards** (DEMO_FEEDBACK_005 #7/#8): `overdue-parts-card.tsx` lists every
overdue part (not just the worst), internally scrollable past 3 rows, hidden entirely when nothing
is overdue. `home-nav-cards.tsx` are two shortcuts to Touring and Lucky Draw (still "Feature coming
soon" placeholders themselves).

**Cross-tab profile**: the profile entry point itself lives in `app/(tabs)/_layout.tsx` (a shared
header button, not owned by this feature) — see `src/components/profile-popup.tsx` and
`src/hooks/use-current-user.ts`, both app-level since profile/auth isn't specific to Home.
