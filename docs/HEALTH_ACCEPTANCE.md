# Acceptance Criteria — HEALTH_CHECK MVP

> **Owner**: product-owner agent. **For**: qa-automation (test targets), frontend-developer &
> backend-developer (build targets).
> **Depends on decisions in**: [DECISIONS.md](DECISIONS.md) — every scenario below cites the decision
> ID it's derived from. If a decision changes, these criteria change with it.
> **Scope**: Health MVP only, per D-HEALTH-MVP-SCOPE. Numbers used in examples are illustrative test
> fixtures, not new business rules.

---

## AC-1 — Four-state status boundaries (D-STATUS-BOUNDARIES)

Fixture: a distance-based service item with `interval = 2500` km, `last_service_km = 0`.

- **Given** `current_odometer_km = 1625` (progress = 65.0%)
  **When** status is computed
  **Then** status = **Fresh** (green meter), meter shows 65%, label shows "Fresh" + remaining
  (875 km).

- **Given** `current_odometer_km = 1626` (progress = 65.04%)
  **When** status is computed
  **Then** status = **Due soon** (orange meter), label = "Due in 874 km".

- **Given** `current_odometer_km = 2250` (progress = 90.0%)
  **When** status is computed
  **Then** status = **Due soon** (boundary value belongs to lower-severity state).

- **Given** `current_odometer_km = 2251` (progress = 90.04%)
  **When** status is computed
  **Then** status = **Replace** (red meter), label = "This part needs to be replaced/repaired".

- **Given** `current_odometer_km = 2500` (progress = 100.0%)
  **When** status is computed
  **Then** status = **Replace** (boundary value belongs to lower-severity state).

- **Given** `current_odometer_km = 2501` (progress = 100.04%)
  **When** status is computed
  **Then** status = **Overdue** (deeper red meter), ⚠ icon shown next to the part name, label =
  "Overdue 1 km — replace/repair as soon as possible".

- **Given** `current_odometer_km = 3750` (progress = 150%)
  **When** the meter renders
  **Then** the bar renders visually full at 100% (never overflows past the container) and the
  Overdue message + ⚠ icon are shown instead.

- **Given** a time-based item (e.g., `interval = 1095` days ≈ 3 years) and an event-count item (e.g.,
  Oil Filter, `interval = 2` events)
  **When** the same relative-progress values (65%, 66%, 90%, 91%, 100%, 101%) are reached on their
  respective axes
  **Then** the same status boundaries apply identically (D-OQ-H3-TIME-DUAL-AXIS).

- **Given** a dual-axis item where the distance axis reads Fresh and the time axis reads Overdue
  **When** overall status is computed
  **Then** overall status = **Overdue** (worst of the two, never averaged).

---

## AC-2 — Mark as replaced/serviced resets only that item (D-HEALTH-MVP-SCOPE, KB §2.3)

- **Given** "Engine oil" has `last_service_km = 10000`, `interval = 2500`,
  `current_odometer_km = 12300` (status = Overdue, progress = 112%)
  **When** the user marks "Engine oil" as Replaced and confirms
  **Then** Engine oil's `last_service_km` becomes `12300`, its progress resets to 0%, its status
  becomes Fresh, **and** the vehicle's `current_odometer_km` and every other service item's
  `last_service` are unchanged.

- **Given** the same action includes an entered price (e.g., $30)
  **When** saved
  **Then** a spend entry (type = Parts, amount = $30, date = today) is created and the
  Spent-this-year total/top-3 update without additional navigation (AC-6).

---

## AC-3 — Oil filter: event-count axis, every 2nd oil change (D-OQ-H9-OIL-FILTER-SEEDING)

- **Given** Oil Filter's event-count baseline = 0 (0 of 2 oil changes elapsed, progress 0%, Fresh)
  **When** the user marks "Engine oil" as Replaced (1st oil-change event since baseline)
  **Then** Oil Filter's count = 1 of 2 → progress = 50% → status = **Fresh**.

- **Given** Oil Filter's count = 1 of 2
  **When** the user marks "Engine oil" as Replaced again (2nd oil-change event since baseline)
  **Then** Oil Filter's count = 2 of 2 → progress = 100% → status = **Replace** (service due now).

- **Given** Oil Filter's count = 2 of 2 and the filter was NOT replaced
  **When** the user marks "Engine oil" as Replaced a 3rd time
  **Then** Oil Filter's count = 3 of 2 → progress = 150% → status = **Overdue**, ⚠ icon shown.

- **Given** Oil Filter's count = 3 of 2 (Overdue)
  **When** the user marks **Oil Filter itself** as Replaced
  **Then** Oil Filter's event-count baseline resets to 0 (0 of 2, progress 0%, Fresh),
  **independently** of Engine Oil's own km-based `last_service_km`, which is unaffected.

---

## AC-4 — km / miles conversion (HEALTH_REQ §8, D-UNIT-ROUNDING)

- **Given** the display unit = Miles and canonical `current_odometer_km = 40355`
  **When** Live Vitals renders
  **Then** it shows **25,075 mi** (40355 × 0.621371 = 25075.43… → rounded to nearest whole mile per
  D-UNIT-ROUNDING), and the stored canonical value remains `40355` km, unchanged.

- **Given** the display unit = km
  **When** the user switches the unit to Miles in settings
  **Then** every distance on screen (odometer, remaining-km labels, due-in-X labels) re-renders in
  miles immediately, with **no write** to the database (conversion is presentation-only).

- **Given** the display unit = Miles
  **When** the user manually edits the odometer and enters `100` (miles)
  **Then** the value is converted to km before storage (100 × 1.609344 = 160.9344), **stored as
  161 km** (rounded to nearest whole km per D-UNIT-ROUNDING).

---

## AC-5 — Trip distance increments the shared odometer once, never touches `last_service` (KB §2.3, HEALTH_REQ §3, D-OQ-H1-ODOMETER-SOURCE)

- **Given** `current_odometer_km = 40000` and "Engine oil" `last_service_km = 39000`
  (`interval = 2500`, progress = 40%, Fresh)
  **When** a recorded trip of 355 km is applied via `apply_trip_distance(trip_id)`
  **Then** `current_odometer_km` becomes `40355` (incremented exactly once) **and** Engine oil's
  `last_service_km` remains `39000` (unchanged — only its *computed* progress reflects the new
  odometer: (40355−39000)/2500 = 54.2%, still Fresh) **and** no other service item's `last_service`
  changes.

- **Given** the same `trip_id` is submitted to `apply_trip_distance` a second time (e.g., retry after
  a network error)
  **When** the RPC runs again
  **Then** the shared odometer is **not** incremented a second time for the same trip (idempotent per
  `trip_id`) — this is an implementation requirement of "exactly once," not just a happy-path check.

---

## AC-6 — Spend top-3 / total + Jan-1 reset (D-OQ-H5-SPEND-YEAR, D-YEAR-BOUNDARY-TZ)

- **Given** four spend entries this calendar year: Tires $150, Chain $80, Brake pads $45, Engine oil
  $30
  **When** the Health tab's Spend summary loads
  **Then** Top-3 shows **[Tires $150, Chain $80, Brake pads $45]** and Total = **$305** (sum of all
  four entries, including the 4th which isn't in the top-3 list).

- **Given** it is Jan 1 in the user's device-local timezone (new calendar year)
  **When** the Spend summary loads
  **Then** Total = **$0**, Top-3 list is **empty**, and `current_odometer_km` and every service
  item's progress/status are **unchanged** from Dec 31.

- **Given** a spend entry dated in the previous calendar year
  **When** the current year's Spend summary loads
  **Then** that entry is excluded from the current total/top-3 **and is not deleted** (available if a
  historical view exists later — full Spend-details/history is deferred per D-HEALTH-MVP-SCOPE, but
  data must not be lost).
