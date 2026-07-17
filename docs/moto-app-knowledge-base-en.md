# Knowledge Base: Moto Health & Touring App (Moto Companion App)

> This document describes the **goals & business functions** of the project — it does NOT include
> data model design, backend, or frontend design. Technical design will be handled by a separate AI
> agent in a later step, using this document as the business input.

---

## 1. PROJECT_OVERVIEW

- **Project name (working title)**: Moto Companion App
- **Application type**: Mobile app (iOS/Android)
- **Target users**: Motorcycle touring riders, bike owners who want to track their vehicle's maintenance status
- **3 core business functions**:
  1. `HEALTH_CHECK` — Track the vehicle's technical condition & schedule maintenance
  2. `TOURING_PLAN` — Plan touring trips
  3. `MAP_TRACKING` — Record and redraw the route traveled on a map
- App-wide (cross-cutting) requirements — authentication, onboarding, units, language — are
  covered in §5, since they support all three functions but are not one of them.

---

## 2. BUSINESS FUNCTION: HEALTH_CHECK

### 2.1 Business goal
Allow the user to enter basic technical parameters of their vehicle, configure a maintenance plan, and receive a notification when a given metric's wear status becomes more severe (Due soon / Replace / Overdue — see §2.3).

### 2.2 Metrics to track

The user has confirmed the following metrics:
- Total distance traveled (km)
- Coolant condition
- Engine oil
- Oil filter (event-count linked to Engine oil — see below and §2.3)
- ... (open-ended, more can be added)

Common suggested extensions based on real-world motorcycle maintenance (need project owner confirmation, not yet finalized — OQ-H7):
- Tires (front/rear)
- Brake pads (front/rear)
- Chain & sprocket set
- Air filter
- Battery
- Spark plug
- Brake fluid

> Business note: the list of metrics should be treated as **extensible/configurable**, not fixed — the user should be able to add new metric types in the future.

- **Interval basis is also extensible.** Most metrics are distance- or time-based, but a metric may
  instead be **event-count**-based. Confirmed case: **Oil filter**, which is replaced on every
  **2nd** engine-oil-change event (i.e., on the 2nd, 4th, 6th… oil change), not on its own
  independent distance/time interval. §2.3 defines how event-count progress is computed.

### 2.3 Business rule: configuring the maintenance plan & wear status (canonical model)

- Each metric ("service item") has a **maintenance interval** on one or more axes:
  - **Distance** (km) — e.g., Engine oil every 2,500 km.
  - **Time** (days) — e.g., Brake fluid every 3 years.
  - **Event count** — e.g., Oil filter every 2nd engine-oil-change event (§2.2). On this axis, the
    "interval" is a count (2) and the "current value" is the number of qualifying events since the
    metric's baseline.
- Each metric has a **baseline** (`last_service`) matching its configured axis/axes: an odometer
  value, a date, and/or an event count. **The baseline moves only when the user logs an actual
  service/replacement event for that specific metric** ("Mark as replaced/serviced") — never as a
  side effect of trip-distance accumulation, the passage of time, or servicing a *different* metric.
  (The Oil Filter's event-count baseline is the sole confirmed exception: it advances in lockstep
  with the shared engine-oil-change counter, because that counter is precisely what it is defined to
  track — §2.2.)

- **Canonical status model — percentage-of-interval ("Progress"), four states.** This is now the
  single source of truth for wear status (it supersedes the earlier remaining-vs-threshold wording
  from a prior draft of this document). For each configured axis:

  `progress = (current_value − last_service_value) / interval`, expressed as a percentage (can exceed 100%).

  - Distance axis: `current_value` = the vehicle's one shared `current_odometer_km` (see the
    shared-odometer invariant below).
  - Time axis: `current_value` = today's date.
  - Event-count axis: `current_value` = qualifying-event count since baseline (e.g., oil-change count).

  Status is derived from `progress` with fixed cut-offs, identical on every axis (per OQ-H3):

  | Status | Progress range | Meaning | Prior-model equivalent |
  |---|---|---|---|
  | **Fresh** | 0% ≤ progress ≤ 65% | Healthy | `ok` |
  | **Due soon** | 65% < progress ≤ 90% | Approaching service | `warning` |
  | **Replace** | 90% < progress ≤ 100% | Service due now | *(new state — no prior equivalent)* |
  | **Overdue** | progress > 100% | Past due | `overdue` |

  These four exact cut-offs (65%, 90%, 100%) are the primary unit-test targets. Status thresholds
  apply to the **continuous** progress ratio, not to a rounded display percentage: Fresh if
  `progress ≤ 65`; Due soon if `65 < progress ≤ 90`; Replace if `90 < progress ≤ 100`; Overdue if
  `progress > 100`. (Read as whole-number percents this is: 0–65 Fresh, 66–90 Due soon, 91–100
  Replace, >100 Overdue — the continuous form additionally makes fractional values well-defined.)

  > **Reconciliation note:** a prior draft of this document let the user configure a **per-metric
  > warning threshold** (e.g., "warn me 500 km before due"). The percentage model instead applies
  > **fixed, universal** cut-offs (65/90/100%) to every metric regardless of its interval size. This
  > is a real change in configurability, not just a renaming — flagged as **OQ-H10** (§7) for
  > product-owner confirmation that this is intentional.

- **Dual-axis rule (still holds):** if a metric has more than one axis configured, overall status =
  the **worst** of the per-axis statuses, ranked `Overdue` > `Replace` > `Due soon` > `Fresh`.
  Progress values are not summed/averaged across axes — only the resulting status label is compared.

- **Single shared odometer invariant (still holds):** `current_value` on the distance axis is always
  the vehicle's one shared `current_odometer_km` (§2.2) — no metric has its own private "current
  km." A metric's individual identity is expressed only through its own `last_service_km` baseline
  and `interval`. Adding trip distance (§4.2) increments that one shared field exactly once and must
  never write to any metric's `last_service` baseline (that baseline only moves on an actual logged
  service event, per above).

- **Event-count metrics use the same four-state bands on their own axis.** Example — Oil Filter: 0
  oil changes since baseline = 0% (Fresh); 1 of 2 = 50% (Fresh); 2 of 2 = 100% (Replace — service is
  due the moment the 2nd Engine Oil change happens); 3 of 2 = 150% (Overdue, if the user skips
  replacing the filter on the 2nd oil change and does a 3rd oil change anyway).

- Meter/status display renders 0–100% only; past 100% it stays visually full and the app substitutes
  the Overdue message + warning icon rather than overflowing the bar — a display concern noted here
  only because it is a direct consequence of the Overdue definition above (exact visual treatment is
  designer's call).

### 2.4 Open business questions

HEALTH_CHECK's open questions are tracked with stable IDs in the consolidated list, §7:
OQ-H1 (odometer update source), OQ-H2 (default baseline for a part not marked "recently changed," or
for any metric added after onboarding), OQ-H3 (time-axis cut-offs & dual-axis confirmation), OQ-H4
(brand/bike/model coverage for MVP), OQ-H5 ("this year" definition), OQ-H6 (notification channel),
OQ-H7 (final MVP metric list), OQ-H8 (notification behavior across the four wear states), OQ-H9
(oil-change event-counter seeding/reset), OQ-H10 (fixed vs. per-metric-configurable warning
threshold).

Two related questions about how TOURING_PLAN's pre-departure check consumes these statuses were
moved to §3.3 as OQ-T1/OQ-T2 — they describe TOURING_PLAN's behavior, not HEALTH_CHECK's, and
belong there. The former "manual vs. automatic odometer update" and "manage multiple vehicles"
items are merged into OQ-H1 and OQ-G2 respectively (§7) and are no longer listed separately here.

---

## 3. BUSINESS FUNCTION: TOURING_PLAN

### 3.1 Business goal
Allow the user to plan touring trips (potentially multi-day), including planned stops/checkpoints along the route.

### 3.2 Business link with HEALTH_CHECK
- Before starting a planned trip, the system checks the maintenance status of the vehicle selected
  for that trip (HEALTH_CHECK §2.3's four wear states: Fresh / Due soon / Replace / Overdue) and
  warns the user if the vehicle needs attention. Exactly which state(s) trigger the warning, and
  whether the warning blocks trip start, are open — see OQ-T1, OQ-T2 (§7).

### 3.3 Open business questions
- **OQ-T1** — Does the pre-departure check act on `Overdue` metrics only, or also `Replace`/`Due
  soon`? Prior wording ("warn ... if overdue") implied Overdue-only; the four-state model (§2.3)
  reopens this because `Replace` (90–100%) is meaningfully "not yet overdue but urgent."
- **OQ-T2** — Is the pre-departure warning **blocking** (prevents starting the trip) or
  **non-blocking** (dismissable, user can proceed anyway)? Prior wording used "warn," not
  "block/prevent" — current reading is non-blocking, needs confirmation.
- **OQ-T3** — Is automatic route suggestion (routing) needed, or does the user just manually pin
  points on the map?
- **OQ-T4** — Should trip plans be shareable with a group of riders?

Full detail and status for all four is in the consolidated list, §7.

---

## 4. BUSINESS FUNCTION: MAP_TRACKING

### 4.1 Business goal
While the user is riding, the app records the trip in real time and redraws the traveled path on the map for the user to review later.

### 4.2 Business link with HEALTH_CHECK
- Distance recorded from a trip accumulates into the vehicle's shared `current_odometer_km`, which
  every HEALTH_CHECK wear calculation reads (§2.3's single shared-odometer invariant). Whether this
  accumulation is automatic or requires manual user confirmation is open — see OQ-H1 (§7). The
  accuracy of the recorded distance itself (e.g., under GPS signal gaps) is a separate open question
  — see OQ-M3 (§7).

### 4.3 Open business questions
- **OQ-M1** — Does the trip need to be recorded while the app runs in the background (not open)?
- **OQ-M2** — Does the user need to review a history of past trips (not just the current one)?
- **OQ-M3** *(business-analyst, newly identified)* — How should GPS signal gaps/loss during a trip
  affect the distance credited to the vehicle's shared odometer (§2.3) — interpolate across the gap,
  drop the segment, or flag the trip for user review/correction before it is applied? This directly
  affects the accuracy of every HEALTH_CHECK wear-status calculation, since they all read the same
  `current_odometer_km`.

Full detail in the consolidated list, §7.

---

## 5. GLOBAL REQUIREMENTS (cross-cutting: auth, onboarding, units, language)

These requirements apply across all three core functions rather than belonging to one of them;
they are placed after HEALTH_CHECK/TOURING_PLAN/MAP_TRACKING only to keep those functions' existing
section numbers (§2–§4) stable for cross-references elsewhere in the project.

### 5.1 Authentication
- MVP sign-in method: **Google (Gmail)** only — either registering a new account with Gmail or
  signing in with an existing Gmail-linked account (same underlying provider, two entry points).
- **Session persistence ("Remember me")**: if enabled, the user is not asked to re-authenticate on
  the next app launch; if disabled, the user must sign in again each launch.
- Business trigger: a first-time sign-in (no existing account) routes the user into first-launch
  onboarding (§5.2) before they reach any of the three core functions.

### 5.2 First-launch onboarding
Runs once, the first time a user signs in (§5.1), before the user reaches HEALTH_CHECK,
TOURING_PLAN, or MAP_TRACKING. Steps, in order:
1. **Choose language** (§5.4).
2. **Enter bike information**:
   a. Bike name and brand.
   b. Current mileage, with display unit (§5.3).
   c. **Recently changed parts** — a checklist drawn from the service items in §2.2.

- **Business rule (confirmed):** for every part the user checks as "recently changed," that part's
  `last_service` baseline is set to the entered current mileage — i.e., its Progress (§2.3) starts
  at **0%, Fresh**.
- For parts **not** checked as recently changed, the default baseline is an open question — see
  OQ-H2 (§7).
- MVP scope: one bike per user at onboarding (see OQ-G2, §7, for whether multi-vehicle support is
  needed at onboarding vs. added later).

### 5.3 Units
- Canonical storage unit for all distances (odometer, intervals, last-service baselines) is **km**.
  This never changes regardless of display preference.
- The user chooses a **display unit** (km or miles) at onboarding (§5.2) and can change it later.
- Conversion is **presentation-only**: `miles = km × 0.621371`; `km = miles × 1.609344`. No stored
  value is ever persisted in miles — only the UI formats the canonical km value for display.
- This applies uniformly across HEALTH_CHECK (odometer, intervals), TOURING_PLAN, and MAP_TRACKING
  distances.

### 5.4 Language
- MVP ships two languages: **English** and **Vietnamese**.
- Chosen at first-launch onboarding (§5.2) and changeable later.
- Business requirement: no feature ships user-facing text in only one of the two languages.

### 5.5 Open business questions
- **OQ-G1** — Auth providers for MVP: Gmail-only, or also Apple/email? (Apple Sign-In may be
  required by App Store review if any third-party sign-in is offered.)
- **OQ-G2** — Multiple vehicles per user: supported at onboarding, or added later? (Merges the
  former standalone "does the app need to support managing multiple vehicles per user?" question.)
- **OQ-G3** — Default language: device locale, or always prompt at first launch?

Full detail in the consolidated list, §7.

---

## 6. OVERALL BUSINESS FLOW (links between functions)

Before any of the three core functions, first-time users pass through Authentication and Onboarding
(§5.1, §5.2): sign in with Gmail → (first time only) choose language, enter bike info, mark
recently-changed parts → land on HEALTH_CHECK with seeded baselines.

```
User rides the bike (MAP_TRACKING records the trip)
        │
        ▼
Distance traveled is added to the vehicle's shared odometer (HEALTH_CHECK, §2.3)
        │
        ▼
System re-evaluates each metric's Progress against the four wear states (§2.3)
        │
        ▼
If a metric's status becomes more severe → notification to the user (exact trigger states: OQ-H8)

When the user creates a new TOURING_PLAN:
        │
        ▼
System checks the vehicle's maintenance status (HEALTH_CHECK) → warns before departure
(exact scope/blocking behavior: OQ-T1, OQ-T2)
```

---

## 7. OPEN BUSINESS QUESTIONS — CONSOLIDATED (FOR PRODUCT-OWNER)

None of the items below are decided. The "working assumption" column (where present) is a
provisional reading used to keep drafting unblocked — it is **not** a decision. Do not implement
against it without product-owner sign-off. IDs are stable — reference them in code, PRs, and
`DECISIONS.md`.

#### HEALTH_CHECK

| ID | Question | Working assumption (unconfirmed) |
|---|---|---|
| OQ-H1 | Odometer update: GPS/trip-accumulation only, manual entry only, or both? | Both |
| OQ-H2 | Default `last_service` baseline for (a) a part not marked "recently changed" at onboarding, and (b) any metric added later — entered/current odometer (partway through its interval, possibly already Due soon/Replace/Overdue), or zero? | Entered/current odometer |
| OQ-H3 | Time-axis: do the same 65/90/100% cut-offs apply, and is dual-axis worst-of-two confirmed? | Yes to both |
| OQ-H4 | Brand/bike/model catalog coverage for MVP launch — which brands/models must be research-verified vs. fall back to generic defaults? | Generic-default fallback with a visible "using generic defaults" note |
| OQ-H5 | "Spent this year" — calendar year or rolling 12 months? | Calendar year, resets Jan 1 |
| OQ-H6 | Notification channel — in-app only, or also email/SMS? | Not yet assumed |
| OQ-H7 | Final MVP metric list — which of §2.2's suggested extensions (tires, brake pads, chain, air filter, battery, spark plug, brake fluid, etc.) ship by default at launch? | Not yet assumed |
| OQ-H8 *(new)* | With four wear states now defined (§2.3), does a notification fire at every state transition (Fresh→Due soon, Due soon→Replace, Replace→Overdue), or only some? The prior two-tier model (warning/overdue) doesn't map cleanly onto three non-Fresh states. | Not yet assumed |
| OQ-H9 *(new)* | The oil-change event counter driving Oil Filter's progress (§2.2, §2.3): how is it seeded for a bike with unknown pre-existing oil-change history at onboarding, and can it reset independent of a filter replacement (e.g., user changes bikes)? | Not yet assumed |
| OQ-H10 *(new)* | The percentage model uses fixed universal cut-offs (65/90/100%) for every metric, replacing the prior per-metric configurable warning threshold. Is removing that configurability intentional? | Not yet assumed |

#### TOURING_PLAN

| ID | Question | Working assumption (unconfirmed) |
|---|---|---|
| OQ-T1 | Pre-departure check (§3.2): acts on `Overdue` only, or also `Replace`/`Due soon`? | Overdue-only (per prior wording), but ambiguous now that `Replace` exists as its own state |
| OQ-T2 | Pre-departure warning: blocking (prevents starting the trip) or non-blocking (dismissable)? | Non-blocking |
| OQ-T3 | Automatic route suggestion needed, or manual pin-dropping only? | Not yet assumed |
| OQ-T4 | Should trip plans be shareable with a group of riders? | Not yet assumed |

#### MAP_TRACKING

| ID | Question | Working assumption (unconfirmed) |
|---|---|---|
| OQ-M1 | Must trips record while the app is backgrounded (not open)? | Not yet assumed (build foreground-first, background behind a feature flag until confirmed) |
| OQ-M2 | Does the user need a history of past trips, not just the current one? | Not yet assumed |
| OQ-M3 *(new)* | How do GPS signal gaps/loss during a trip affect distance credited to the shared odometer — interpolate, drop the segment, or flag for user review? | Not yet assumed |

#### GLOBAL (auth, onboarding, language)

| ID | Question | Working assumption (unconfirmed) |
|---|---|---|
| OQ-G1 | Auth providers for MVP: Gmail-only, or also Apple/email? | Gmail-only (watch the App Store Apple-Sign-In rule if any third-party sign-in ships) |
| OQ-G2 | Multiple vehicles per user: supported UI at onboarding/launch, or one bike only for MVP with "add bike" deferred? | One bike for MVP; data model still multi-vehicle-ready |
| OQ-G3 | Default language: device locale, or always prompt at first launch? | Prompt at first launch, highlighting device locale |

**Merged/removed duplicates** from the pre-reconciliation version of this document: "manual vs.
automatic odometer update" → merged into **OQ-H1**; "does the app need to support managing multiple
vehicles per user?" → merged into **OQ-G2**; "default `last_service_value` baseline for a newly
configured metric" → merged into **OQ-H2** (broadened to also cover onboarding). They are no longer
listed as separate items anywhere in this document.

---

## 8. SCOPE OF THIS DOCUMENT

- This document **focuses solely on the goals & business functions** of the project.
- It does **NOT** include: data models, database structure, backend/frontend architecture, or technology choices — these will be handled by a technical design agent in a later step, based on this document.

---

## 9. DOCUMENT STATUS

- **Version**: 0.3 — reconciled the percentage-of-interval wear model (§2.3) as canonical, replacing
  the prior remaining-vs-threshold wording; added §5 (Global cross-cutting requirements: auth,
  onboarding, units, language); added §7 (consolidated, de-duplicated open-question list spanning
  all sections). Business-function section numbers (§2 HEALTH_CHECK, §3 TOURING_PLAN, §4
  MAP_TRACKING) are unchanged from v0.2 to keep external cross-references (FRAMEWORK_RULES.md,
  HEALTH_REQ.md, GLOBAL_REQ.md, GUIDELINE.md) valid.
- **Needs updating when**: the final list of maintenance metrics is confirmed (OQ-H7), and any item
  in the §7 consolidated open-questions list is answered by product-owner.
