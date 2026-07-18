# Feature: health-check (KB §2 · [HEALTH_REQ.md](../../../docs/HEALTH_REQ.md))

Status: **Implemented, tested, and iterated through 3 rounds of demo feedback.** Layout per
FRAMEWORK_RULES §1:

```
index.ts     Public API — the ONLY entry point for code outside this feature (Rule 1.2):
             HealthCheckScreen, OnboardingScreen, useVehicle
screens/     health-check-screen.tsx, onboarding-screen.tsx — composed screens rendered by the
             thin routes in /app
components/  Feature UI: wear-meter, service-item-card, service-item-detail-sheet,
             edit-odometer-modal, edit-vehicle-modal, permission-notice, spend-summary-section,
             spend-details-sheet, service-reminders-section, live-vitals-section, stat-tile,
             async-state, theme (re-exports the shared @/theme palette)
api/         TanStack Query hooks (Rule 3.3): useVehicle, useUpdateVehicle, useServiceItems,
             useSpendEntries, useTodaysDistanceKm, useMarkServiceDone, useUndoLastService,
             useSetOdometer, useSetLastServiceKm, usePartTypeDefaults, useOnboardVehicle —
             all Supabase/RPC calls via @/lib/supabase
i18n.ts      useT() — resolves a LabelDefinition against the app-wide language (@/i18n)
logic/       PURE TypeScript business logic — no React, no Supabase (Rule 1.3)
types.ts     toServiceItemViewModel(row, vehicle, now, unit, language) — DB row → view model
```

`logic/` holds the canonical business rules and is the primary unit-test target (Rule 6.2):

- **status.ts** — the four-state wear model (`fresh | due_soon | replace | overdue`) from
  `progress = (current − last_service) / interval`, with the exact boundaries ratified in
  [DECISIONS.md](../../../docs/DECISIONS.md) `D-STATUS-BOUNDARIES` (p≤0.65 fresh, ≤0.90 due_soon,
  ≤1.00 replace, >1.00 overdue; boundary → lower-severity). Handles km / days / event-count axes and
  returns worse-of-axes for multi-axis items.
- **units.ts** — km↔mi conversion, whole-unit display rounding (`D-UNIT-ROUNDING`).
- **spend.ts** — current-calendar-year filtering (device-local, `D-YEAR-BOUNDARY-TZ`), total, top-N.
- **labels.ts** — all Health-tab copy as `{key, fallback, vi}` triples (English + Vietnamese,
  `D-DEMO2`), resolved via `useT()`/`resolveLabel` — no inline hardcoded text.
- **part-names.ts** — `type_key → Vietnamese name` map for the 13 default parts (`D-DEMO3`);
  falls back to the stored DB name for custom/user-added parts (Rule 8.3 extensibility). Draft
  translations pending native-speaker review (KNOWN_ISSUES KI-10).

Acceptance criteria: [HEALTH_ACCEPTANCE.md](../../../docs/HEALTH_ACCEPTANCE.md) (AC-1..AC-6).
Server-side invariants (baseline resets, odometer accumulation, oil-filter coupling, undo) live in
Postgres RPCs (`mark_service_done`, `undo_last_service`, `apply_trip_distance`, `set_odometer`,
`onboard_vehicle`) per Rule 4.5 — this feature calls them, it does not re-implement them
client-side. Known limitations: [KNOWN_ISSUES.md](../../../docs/KNOWN_ISSUES.md).
