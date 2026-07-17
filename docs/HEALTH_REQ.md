# Feature Requirements — HEALTH_CHECK (the "Health" tab)

> **Status**: Draft for reconciliation · **Owner**: product-owner · **Author of record**: business-analyst
> **Feature**: 1 of 3 core flows (see [moto-app-knowledge-base-en.md](moto-app-knowledge-base-en.md) §2)
> **Related**: [GLOBAL_REQ.md](GLOBAL_REQ.md) (auth, onboarding, units, i18n) ·
> [FRAMEWORK_RULES.md](FRAMEWORK_RULES.md) (how to build it)
>
> **NOTE FOR AI / researched data**: Where a value is marked _generic default_, it is a reasonable
> engineering starting point from general motorcycle-maintenance practice, **not** a brand-verified
> figure. Brand/bike/model-specific intervals and prices are populated into reference tables in the
> database (see §6, §7) and override these generic defaults when the user selects a specific bike.
> Any value still marked `[NEEDS RESEARCH]` must be filled from real brand data before release.

---

## 1. Purpose

The Health tab tells the rider the **current technical condition of the bike** at a glance and
reminds them **what needs servicing and when**. The two areas that carry the most product value are
**Service Reminders** and **part-wear tracking** — everything else on the page supports them.

The page is composed of three stacked sections, in priority order:

1. **Service Reminders** (primary) — part-wear status + maintenance schedule.
2. **Spent this year** (secondary) — money spent on parts/services this calendar year.
3. **Live Vitals** (lowest emphasis) — current odometer and today's distance.

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Odometer / Odo** | The vehicle's single, shared total distance. One value per bike (KB §2.3). |
| **Service item** | A trackable maintenance part/task for a bike (e.g., Engine Oil), with its own interval and last-service baseline. |
| **Interval** | How much distance (km/mi) or time between services for a part. |
| **Last service** | The odometer value (or date) at which the part was last replaced/serviced — the baseline the reminder counts up from. |
| **Progress** | How much of the interval has been consumed: `(current_odometer − last_service) / interval`, expressed 0–100%+. |
| **Fresh / Due / Replace / Overdue** | The four wear states, derived from Progress (see §5). |

---

## 3. Live Vitals (lowest emphasis)

Displays two read-only values:

- **Current Odometer** — the bike's shared total distance, in the user's chosen unit (km/mi).
- **Today's distance** — distance travelled today, in the user's chosen unit.

### Distance source (MVP)

- The app requests **GPS permission** and derives distance travelled from the phone's location while
  a ride is active (this is the MAP_TRACKING flow; Health only *reads* the resulting odometer).
- Recorded trip distance accumulates into the shared odometer. **Adding trip distance increments the
  one shared odometer exactly once and never rewrites any part's last-service baseline** (KB §2.3,
  FRAMEWORK_RULES Rule 4.5).

**Acceptance criteria**

- Given a newly bought bike entered at 0 km, when the rider travels 2 km home, then Live Vitals
  shows **2 km**.
- Given a bike entered at 40,000 km, when the rider completes a 3-day, 355 km tour, then Live Vitals
  shows **40,355 km**.
- Given the user's unit is Miles, when the odometer is 40,355 km, then it displays as **~25,076 mi**
  (see §8 for conversion).

> **Open question (OQ-H1)**: Is odometer updated only via GPS/trip accumulation, only via manual
> edit, or both? Current assumption: **both** — GPS accumulates automatically, and the user can also
> edit the odometer manually (see §4). Needs product-owner confirmation.

---

## 4. Service Reminders (primary)

A list of the bike's service items. The list content and the per-item card must match the design
mockup ([design/mockup/app-ui.html](../design/mockup/app-ui.html)).

### 4.1 What each service-item card shows

- Part name + a **wear meter/chart** (0–100%) colored by status (§5).
- A **status word** and the relevant distance/time (see §5 for exact wording per state).
- A **warning icon** next to the name when the part is Overdue (>100%).

### 4.2 Interactions

- **Tap a part** → opens its **detail page** (part history, interval, last service, price).
- **Edit odometer** — the user can edit the bike's current mileage from this section.
- **Mark as replaced/serviced** — when the user services a part (e.g., only changes the oil), they
  set that item to **Replaced**. Its meter **resets to 0% (0 km since service)** and its
  last-service baseline moves to the current odometer. This affects only that item — never the
  odometer, never other parts (KB §2.3).
- **Per-part price** — the user can enter a price for a part; the page shows a **running total** at
  the bottom (feeds "Spent this year", §7).

### 4.3 How the numbers are seeded

- The first values are computed from the **bike information entered at first launch**
  (see [GLOBAL_REQ.md](GLOBAL_REQ.md) §2): current mileage + which parts were recently changed.
- If the user marked a part as "recently changed" during onboarding, that part's reminder starts at
  **0%** (last service = the entered current odometer).

> **Open question (OQ-H2)**: Default baseline for a part **not** marked as recently changed at
> onboarding — is it the entered current odometer (starts partway through its interval, possibly
> already Due/Overdue) or 0? Current assumption: **entered current odometer** (KB §2.4 open item).

---

## 5. Wear status & color model

Status is derived from **Progress** = `(current_odometer − last_service) / interval`, clamped for
display to 0–100%. This **percentage model supersedes** the earlier remaining-vs-threshold wording
in KB §2.3 and must be reconciled there by business-analyst.

| Status | Progress range | Meter color | Word / message shown | Extra |
|---|---|---|---|---|
| **Fresh** | 0% – 65% | Green | `Fresh` + remaining km/mi | — |
| **Due soon** | 66% – 90% | Orange | `Due in <X> km/mi` | — |
| **Replace** | 91% – 100% | Red | `This part needs to be replaced/repaired` | — |
| **Overdue** | > 100% | Deeper red (urgent) | `Overdue <X> km/mi — replace/repair as soon as possible` | ⚠ icon next to part name |

Rules:

- The **meter/chart renders only 0–100%**. Past 100% it stays full and the app shows the Overdue
  **warning message + icon** instead of overflowing the bar.
- Boundaries are inclusive as written (65 = Fresh, 66 = Due, 90 = Due, 91 = Replace, 100 = Replace,
  >100 = Overdue). These exact cut-offs are the primary unit-test targets (FRAMEWORK_RULES Rule 6.2).

> **Open question (OQ-H3)**: For **time-based** items (e.g., Brake fluid every 3 years), Progress is
> `(now − last_service_date) / interval_days`. Confirm the same 65/90/100% cut-offs apply on the
> time axis, and that a dual-axis item takes the **worse** of km/time (KB §2.3 worse-of-two).

---

## 6. Default service intervals (generic defaults)

Used when the user keeps "app defaults" instead of selecting a specific brand/bike/model (§6.1).
All distances are canonical **km**; display converts per §8.

| Part | Default interval | Basis | Notes |
|---|---|---|---|
| Chain lube | 500 km | distance | Maintenance task (re-lube), not a replacement. |
| Engine oil | 2,500 km | distance | |
| Oil filter | every **2nd** engine-oil change | **event count** | Replaced on the 2nd, 4th, 6th… oil change. Not distance-based. |
| Front brake pads | **20,000 km** _(generic default)_ | distance | Front wears faster than rear. |
| Rear brake pads | **25,000 km** _(generic default)_ | distance | |
| Spark plug ("bugi") | **15,000 km** _(generic default)_ | distance | Standard/copper plug; iridium lasts far longer — brand data overrides. |
| Chain replacement | 20,000 km | distance | |
| Tires | 30,000 km | distance | Front/rear may differ; brand data overrides. |
| Air filter (clean or replace) | 10,000 km | distance | |
| Fuel filter | 10,000 km | distance | |
| Coolant | 20,000 km | distance | |
| Brake fluid | 3 years | time | Time-based. |
| Clutch plates | check every 50,000 km | distance | "Check", not automatic replace. |

- The metric list is **extensible** — the user can add new part types (KB §2.2, FRAMEWORK_RULES
  Rule 8.3). These defaults are seed reference data, not a hardcoded enum.

### 6.1 Selecting a specific bike (brand → bike → model)

The user may keep app defaults **or** select their exact bike to get brand-accurate intervals. When
they choose to select, show **three dependent dropdowns**:

1. **Brand** — e.g., Kawasaki, Ducati, Honda, …
2. **Bike** — e.g., Z800, Z1000, S1000RR, CBR1000RR-R, Z900, ZX-10R, …
3. **Model year** — enabled only after Brand + Bike are chosen. The app determines the years that
   bike/brand was produced and lists them for selection.

- The brand/bike/model catalog and its per-part intervals live in **reference tables** in the
  database, populated from real brand data and reused across users (see §9).

> **Open question (OQ-H4)**: Coverage scope for launch — which brands/bikes must be researched and
> seeded for MVP vs. later? Fabricated intervals are not acceptable; unresearched bikes should fall
> back to generic defaults (§6) with a visible "using generic defaults" note.

---

## 7. Spent this year (secondary)

- Shows **total money spent** on the bike's parts/services in the **current calendar year**.
- Lists the **top 3** highest-cost items.
- **Tap** → **Spend details** page listing every spend entry for the year.
- Adding a spend entry: the user first picks a **type**:
  - **Parts** → show the parts list; the user inputs the price manually, or the system suggests a
    price from the reference catalog (§9).
  - **Service** → show a single **bill price** field; the user enters the amount manually.
- After entry, the yearly total recalculates automatically.
- The total **resets on the first day of each new year**. The reset affects **only** "Spent this
  year" — the odometer and service reminders are unaffected.

**Acceptance criteria**

- Given three spend entries this year, when the page loads, then the top-3 list shows the three
  highest amounts and the total equals their sum plus any others.
- Given it is Jan 1, when the year rolls over, then "Spent this year" shows 0 while odometer and all
  reminder progress are unchanged.

> **Open question (OQ-H5)**: "Current year" by calendar year or a rolling 12 months? Assumption:
> **calendar year**, reset Jan 1 (as written).

---

## 8. Units (km / miles)

- **Default unit = km.** The user can switch to **miles**; all displayed distances convert
  automatically.
- **Canonical storage is km.** Conversion is presentation-only: `mi = km × 0.621371`,
  `km = mi × 1.609344`. Intervals, odometer, and last-service are stored in km; the UI formats them.

---

## 9. Data the backend must provide (contract summary)

Detailed schema/RPC design is backend-developer's (FRAMEWORK_RULES §4). Health needs:

- **Per-vehicle**: one shared `current_odometer_km`; a list of service items each with
  `interval`, `last_service_km`/`last_service_date`, optional `price`.
- **Reference catalog** (shared, seeded): default part types + generic intervals; brand → bike →
  model-year → per-part intervals; suggested part/service prices.
- **RPCs / server logic** (Rule 4.5): `mark_service_done(item)` (reset baseline to current odo),
  `apply_trip_distance(trip)` (increment shared odo once), status computation available consistently
  to client and any scheduled check.
- **Spend**: spend entries (type parts/service, amount, date) with a yearly-total read.

---

## 10. Out of scope for this doc / deferred

- Real-time GPS ride recording UI → **MAP_TRACKING** (KB §4).
- Pre-departure maintenance warning → **TOURING_PLAN** (KB §3).
- Push notifications for due/overdue items → server-side (FRAMEWORK_RULES Rule 3.5); channel is a
  KB §2.4 open question.

---

## 11. Open questions (consolidated — for product-owner)

| ID | Question | Current assumption |
|---|---|---|
| OQ-H1 | Odometer update: GPS-only, manual-only, or both? | Both |
| OQ-H2 | Default baseline for a part not marked "recently changed" at onboarding | Entered current odometer |
| OQ-H3 | Time-axis cut-offs & dual-axis worse-of-two confirmation | Same 65/90/100%, worse-of-two |
| OQ-H4 | Brand/bike/model research coverage for MVP; fallback behavior | Generic defaults fallback + note |
| OQ-H5 | "This year" = calendar year or rolling 12 months | Calendar year, reset Jan 1 |
