# Feature: health-check (KB §2 · [HEALTH_REQ.md](../../../docs/HEALTH_REQ.md))

Status: **MVP implemented & tested.** Layout per FRAMEWORK_RULES §1:

```
index.ts     Public API — the ONLY entry point for code outside this feature (Rule 1.2)
screens/     health-check-screen.tsx — composed screen rendered by the thin route in /app
components/  Feature UI: wear-meter, service-item-card, service-item-detail-sheet,
             edit-odometer-modal, service-reminders-section, spend-summary-section,
             live-vitals-section, stat-tile, async-state, theme
api/         TanStack Query hooks (Rule 3.3): useVehicle, useServiceItems, useSpendEntries,
             useTodaysDistanceKm, useMarkServiceDone, useSetOdometer — RPC calls via @/lib/supabase
logic/       PURE TypeScript business logic — no React, no Supabase (Rule 1.3)
types.ts     toServiceItemViewModel(row, vehicle, now, unit) — DB row → view model
```

`logic/` holds the canonical business rules and is the primary unit-test target (Rule 6.2):

- **status.ts** — the four-state wear model (`fresh | due_soon | replace | overdue`) from
  `progress = (current − last_service) / interval`, with the exact boundaries ratified in
  [DECISIONS.md](../../../docs/DECISIONS.md) `D-STATUS-BOUNDARIES` (p≤0.65 fresh, ≤0.90 due_soon,
  ≤1.00 replace, >1.00 overdue; boundary → lower-severity). Handles km / days / event-count axes and
  returns worse-of-axes for multi-axis items.
- **units.ts** — km↔mi conversion, whole-unit display rounding (`D-UNIT-ROUNDING`).
- **spend.ts** — current-calendar-year filtering (device-local, `D-YEAR-BOUNDARY-TZ`), total, top-N.
- **labels.ts** — status wording as string keys + English fallbacks (i18n framework deferred, but no
  inline hardcoded copy — `D-HEALTH-MVP-SCOPE`).

Acceptance criteria: [HEALTH_ACCEPTANCE.md](../../../docs/HEALTH_ACCEPTANCE.md) (AC-1..AC-6).
Server-side invariants (baseline resets, odometer accumulation, oil-filter coupling) live in
Postgres RPCs (`mark_service_done`, `apply_trip_distance`, `set_odometer`) per Rule 4.5 — this
feature calls them, it does not re-implement them client-side. Known limitations:
[KNOWN_ISSUES.md](../../../docs/KNOWN_ISSUES.md).
