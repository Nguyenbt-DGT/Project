# Feature: map-tracking (KB §4)

Layout per FRAMEWORK_RULES §1 — same shape as health-check:
`index.ts` (public API) · `screens/` · `components/` · `hooks/` · `api/` · `logic/` (pure).

Key rules: GPS via expo-location, foreground-first with background behind a flag (Rule 3.4);
buffer trackpoints locally and batch-write (never one insert per point); recording must work fully
offline and sync later (Rule 3.8). Trip distance flows into the vehicle's shared odometer through
ONE database RPC (Rule 4.5) — it never touches any metric's `last_service_km` (KB §2.3).
