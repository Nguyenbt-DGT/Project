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

---

## 2. BUSINESS FUNCTION: HEALTH_CHECK

### 2.1 Business goal
Allow the user to enter basic technical parameters of their vehicle, configure a maintenance plan, and receive a notification when a given metric hits a configured threshold requiring service.

### 2.2 Metrics to track

The user has confirmed the following metrics:
- Total distance traveled (km)
- Coolant condition
- Engine oil
- ... (open-ended, more can be added)

Common suggested extensions based on real-world motorcycle maintenance (need project owner confirmation, not yet finalized):
- Tires (front/rear)
- Brake pads (front/rear)
- Chain & sprocket set
- Air filter
- Battery
- Spark plug
- Brake fluid

> Business note: the list of metrics should be treated as **extensible/configurable**, not fixed — the user should be able to add new metric types in the future.

### 2.3 Business rule: configuring the maintenance plan
- Each metric can have its own **maintenance interval** configured (by distance in km and/or by time).
- The user can configure a **warning threshold** for each metric — e.g., warn when there are X km or Y days remaining until due.
- When a metric reaches/exceeds its configured threshold → the system must send a **notification** to remind the user to service the bike.
- Two severity levels make business sense: "coming due soon" (warning) and "overdue" (overdue) — increasing in severity.
- **Status computation (derived rule, needed to make the above testable):** each metric needs a baseline —
  `last_service_value` (odometer km and/or date the metric was last serviced/reset). Then:
  `remaining = (last_service_value + interval) − current_value` (computed per axis: km and/or time).
  `status = overdue` if `remaining <= 0`; `status = warning` if `0 < remaining <= warning_threshold`; else `status = ok`.
  If a metric has both a km axis and a time axis configured, overall status = the worse of the two
  (`overdue` > `warning` > `ok`).
- **`current_value` on the km axis is the vehicle's single shared `total_distance_traveled_km`** (the metric
  listed in 2.2), never a per-metric counter. A metric's individual identity is expressed only through its own
  `last_service_km` baseline and `interval` — not through a separate "current km." Concretely: one vehicle has
  exactly one `current_odometer_km`; Engine Oil, Chain, Brake Pads, etc. each have their own `last_service_km`
  but all read the same `current_odometer_km` to compute `remaining`. Adding trip distance (see 4.2) increments
  that one shared field once; it must never write to any metric's `last_service_km` (that baseline only moves
  when the user logs an actual service event, a separate action not covered by trip recording).

### 2.4 Open business questions
- [ ] How is total distance traveled updated: manually entered by the user, or automatically accumulated from trip data (MAP_TRACKING)?
- [ ] Does the app need to support managing multiple vehicles per user?
- [ ] Which channel should notifications be sent through (in-app only, or also email/SMS)?
- [ ] The final list of metrics needs to be confirmed with the project owner.
- [ ] What is the default `last_service_value` baseline for a newly configured metric — zero, the vehicle's
      current odometer/date at the time the metric is added, or does the user have to enter it manually? (Affects
      whether a freshly configured metric ever starts life already in "warning"/"overdue" state.)
- [ ] Does the pre-departure check in TOURING_PLAN (3.2) act on `overdue` metrics only, or also on `warning`
      metrics? KB wording ("warn ... if overdue") implies overdue-only; needs confirmation.
- [ ] Is the pre-departure warning in TOURING_PLAN (3.2) blocking (prevents starting the trip) or
      non-blocking (dismissable, user can proceed anyway)? KB uses "warn," not "block/prevent" — current
      reading is non-blocking, needs confirmation.

---

## 3. BUSINESS FUNCTION: TOURING_PLAN

### 3.1 Business goal
Allow the user to plan touring trips (potentially multi-day), including planned stops/checkpoints along the route.

### 3.2 Business link with HEALTH_CHECK
- Before starting a planned trip, the system should check the maintenance status of the vehicle selected for that trip, and warn the user if the vehicle is "overdue" for maintenance.

### 3.3 Open business questions
- [ ] Is automatic route suggestion (routing) needed, or does the user just manually pin points on the map?
- [ ] Should trip plans be shareable with a group of riders?

---

## 4. BUSINESS FUNCTION: MAP_TRACKING

### 4.1 Business goal
While the user is riding, the app records the trip in real time and redraws the traveled path on the map for the user to review later.

### 4.2 Business link with HEALTH_CHECK
- The distance recorded from a trip should be considered for accumulation into the vehicle's total distance traveled (feeding into HEALTH_CHECK) — needs confirmation on whether this is automatic or requires manual user confirmation.

### 4.3 Open business questions
- [ ] Does the trip need to be recorded while the app runs in the background (not open)?
- [ ] Does the user need to review a history of past trips (not just the current one)?

---

## 5. OVERALL BUSINESS FLOW (links between functions)

```
User rides the bike (MAP_TRACKING records the trip)
        │
        ▼
Distance traveled is added to the vehicle's total km (HEALTH_CHECK)
        │
        ▼
System re-checks maintenance metrics against configured thresholds
        │
        ▼
If threshold reached → send a maintenance reminder notification to the user

When the user creates a new TOURING_PLAN:
        │
        ▼
System checks the vehicle's maintenance status (HEALTH_CHECK) → warns if needed before departure
```

---

## 6. SCOPE OF THIS DOCUMENT

- This document **focuses solely on the goals & business functions** of the project.
- It does **NOT** include: data models, database structure, backend/frontend architecture, or technology choices — these will be handled by a technical design agent in a later step, based on this document.

---

## 7. DOCUMENT STATUS

- **Version**: 0.2 (data model/schema removed per request, business function content only)
- **Needs updating when**: the final list of maintenance metrics is confirmed, and the open questions in each section are answered.
