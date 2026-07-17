# Decision Log — Moto Companion App

> **Owner**: product-owner agent. **Referenced by**: FRAMEWORK_RULES.md Rule 8.2 ("Record resolved
> answers in the KB; record decisions in `docs/DECISIONS.md`") and Rule 8.7 (recurring technical
> decisions).
>
> **What this is**: a dated, append-only record of product/technical decisions made to unblock
> design and build. It does not replace the KB (`moto-app-knowledge-base-en.md`) — the KB is the
> business-analyst-owned source of confirmed business rules; this log is where the product-owner
> agent resolves the KB's open questions (§7) into buildable decisions, sets MVP scope, and settles
> small implementation-ambiguity gaps that would otherwise block testable acceptance criteria.
>
> **Status values**:
> - **Decided** — the team builds/tests against this. Within the product-owner's delegated authority
>   (scope, prioritization, UX-default judgment calls) per the agent's charter.
> - **Recommendation pending real stakeholder sign-off** — a genuinely business-critical call
>   (monetization, legal/compliance, final metric list, notification channel, brand-data accuracy)
>   that this log proposes an interim engineering default for so work isn't blocked, but is **not**
>   final until the real project owner confirms. Do not treat as a green light to skip the sign-off.
>
> Each entry: ID · Date · Decision · Rationale · Status. IDs are stable; reference them in code, PRs,
> commit messages, and tests.
>
> **Scope of this round**: entries below unblock the HEALTH_CHECK ("Health") feature build only.
> TOURING_PLAN and MAP_TRACKING open questions (OQ-T*, OQ-M*) and the remaining GLOBAL questions
> (OQ-G1, OQ-G3) are out of scope for this round and are not decided here — they get their own
> decision round when those features are built.

---

## D-STATUS-BOUNDARIES — Wear-status boundary definition (ratified)

**Date**: 2026-07-17

**Decision**: The four-state percentage model is ratified exactly as follows, and is binding for
implementation and testing:

```
progress p = (current_value − last_service) / interval
Fresh:     p ≤ 0.65
Due soon:  0.65 < p ≤ 0.90
Replace:   0.90 < p ≤ 1.00
Overdue:   p > 1.00
```

- Each boundary value (0.65, 0.90, 1.00) belongs to the **lower-severity** state (e.g., exactly 0.65
  is Fresh, not Due soon).
- Applies identically on all three axes — distance (km), time (days), event-count — per KB §2.3.
- The meter/chart renders clamped 0–100% only. Past 100%, the bar stays visually full; the app shows
  the Overdue message + ⚠ icon instead of an overflowing bar.
- Dual-axis items: overall status = worst of the per-axis statuses (`Overdue > Replace > Due soon >
  Fresh`); progress values are never summed/averaged across axes.

**Rationale**: This is already the canonical model in KB v0.3 §2.3 and matches HEALTH_REQ §5
verbatim — no substantive change, just removing any residual ambiguity before the whole team
(frontend, backend, QA) implements and unit-tests against it (FRAMEWORK_RULES Rule 6.2 names these
exact cut-offs as the primary unit-test target). Ratifying it here, word-for-word, means every
downstream test file cites one unambiguous source instead of re-deriving it from prose.

**Status**: Decided.

---

## D-HEALTH-MVP-SCOPE — Health feature MVP scope

**Date**: 2026-07-17

**Decision**: The first Health build ships:

**IN (MVP)**
- **Live Vitals** — current odometer + today's distance, read-only.
- **Service Reminders** — list of service items with: 4-state colored meter (per
  D-STATUS-BOUNDARIES), status word/message, ⚠ icon on Overdue, tap-through to a **basic** detail
  view (name, interval, last service, price), manual **edit odometer**, **mark-as-replaced** (resets
  that item's baseline to current odometer/date/count, per KB §2.3), **per-part price** entry with a
  **running total** at the bottom of the list.
- **Spent-this-year summary** — year total + top-3 highest-cost items, visible directly on the Health
  tab (KB §1 ranks this feature #2 of 3 by emphasis, below Service Reminders).

**DEFERRED (post-MVP; schema may exist now, UI/content later)**
- Brand → bike → model **dropdown selection UI** and the **full brand-data research** behind it.
  Generic defaults + a small curated seed sample ship now (see D-OQ-H4-BRAND-COVERAGE); the
  three-dropdown UX and full catalog wait.
- **Full Spend-details page** (itemized list of every spend entry for the year, historical
  browsing). Only the on-tab summary (total + top-3) ships in MVP.
- **Live GPS ride recording** — this is the MAP_TRACKING flow, a separate core function with its own
  backlog; Health only *reads* the odometer it produces (HEALTH_REQ §3). Building it under Health
  scope would be scope creep into another feature's ownership.
- **Push notifications** for due/overdue items — blocked on OQ-H6 (channel) and OQ-H8 (trigger
  states), both business-critical and unresolved (see below). MVP Health already delivers its core
  value as a pull model (open the app, see status); push is an enhancement, not a blocker.
- **i18n framework** (translation loading, language switcher, Vietnamese content) — tracked as a
  GLOBAL cross-cutting workstream (GLOBAL_REQ §3), not a Health-specific blocker. **Refinement**:
  Health screens must still use string keys/constants rather than inline hardcoded text, so wiring in
  the real i18n framework later is a low-cost swap, not a rewrite. This is a small addition on top of
  "defer i18n" to avoid creating hardcoded-string tech debt now that's expensive to retrofit later.
- **Multi-vehicle UI** — one bike in the UI for MVP; see D-OQ-G2-MULTI-VEHICLE.

**Rationale**: Service Reminders is the primary business-value section per KB §2.1/HEALTH_REQ §1 —
everything deferred here is either (a) a large open-ended content/research effort (brand data) that
doesn't block the core wear-tracking value already delivered by generic defaults, (b) explicitly
another feature's scope (GPS recording → MAP_TRACKING), (c) blocked on unresolved business-critical
questions where building ahead of the answer risks throwaway work (push notifications), or (d) lower
emphasis per the KB's own stated priority order (full Spend ledger — KB ranks Spend below Reminders).
Deferring these keeps the MVP focused on what makes Health useful on day one: "what needs servicing,
and how urgent is it."

**Status**: Decided.

---

## D-OQ-H1-ODOMETER-SOURCE — Odometer update source

**Date**: 2026-07-17

**Decision**: **Both** — the odometer updates automatically via GPS/trip accumulation
(`apply_trip_distance`, adds to the shared value) and can be edited manually by the user (an absolute
set of the shared value). Both paths go through the single RPC layer (FRAMEWORK_RULES Rule 4.5) so
there is one source of truth and no client-side orchestration of the two.

**Rationale**: GPS accumulation can have gaps (no permission, signal loss, phone off) and users
reasonably expect to correct/set their odometer directly (e.g., after buying a used bike, or fixing a
tracking error) — supporting only one path would leave real usage gaps. The two paths don't conflict
functionally as long as manual edit is modeled as "set current value" and trip accumulation as
"increment by trip distance," both enforced server-side.

**Status**: Decided. (Not flagged business-critical; matches the KB/HEALTH_REQ working assumption
and is a low-risk, reversible engineering default within product-owner discretion.)

---

## D-OQ-H2-DEFAULT-BASELINE — Default baseline for a part not marked "recently changed"

**Date**: 2026-07-17

**Decision**: The entered current odometer (at onboarding, or at the moment a new metric is added)
is used as the baseline for any part **not** marked recently changed. Parts marked recently changed
reset to 0% (baseline = entered current odometer at that moment too, but conceptually "just
serviced").

**Rationale**: The alternative (baseline = 0) would show every unchecked part as freshly 100%-away
from due, which actively misleads the rider about a part they never claimed was recently serviced.
Starting an unconfirmed part partway through its interval (possibly already Due soon/Replace/Overdue)
is the safer default — it errs toward prompting the user to check/verify sooner, not toward false
reassurance.

**Status**: Decided.

---

## D-OQ-H3-TIME-DUAL-AXIS — Time-axis cut-offs & dual-axis worst-of-two

**Date**: 2026-07-17

**Decision**: Confirmed — the same 65/90/100% cut-offs apply identically on the time axis (days) and
event-count axis, and a dual-axis item's overall status is the **worst** of its per-axis statuses
(`Overdue > Replace > Due soon > Fresh`), never a sum/average of progress values.

**Rationale**: KB v0.3 §2.3 already states this as canonical ("still holds"), not merely a working
assumption — this decision operationally ratifies it for engineering/test purposes so HEALTH_REQ's
open question (OQ-H3) is closed rather than re-litigated during implementation.

**Status**: Decided.

---

## D-OQ-H10-FIXED-THRESHOLD — Fixed vs. per-metric configurable warning threshold

**Date**: 2026-07-17

**Decision**: **Fixed, universal** cut-offs (65/90/100%) for every metric in MVP. No per-metric
configurable threshold (e.g., "warn me 500 km before due").

**Rationale**: Configurable thresholds add real scope (a settings UI, validation, storage/migration
of a per-user-per-metric preference) for uncertain launch-day value. The fixed percentage model is
simpler to reason about, explain to users ("you're 80% through this part's life"), and test
(FRAMEWORK_RULES Rule 6.2 names these exact cut-offs as primary test targets). This can be layered in
later as a power-user setting without redesigning the underlying Progress calculation — only the
cut-off constants would become per-user-configurable.

**Status**: Decided for MVP. Note this is a genuine behavior change from an earlier KB draft
(removing configurability) — already reflected as canonical in KB v0.3 §2.3; this entry ratifies it
for build purposes. Revisit configurability post-MVP if user feedback demands it.

---

## D-OQ-H4-BRAND-COVERAGE — Brand/bike/model catalog coverage for MVP

**Date**: 2026-07-17

**Decision**: Two parts to this:

1. **Fallback mechanism (Decided)**: Generic defaults (HEALTH_REQ §6) are the baseline for every
   bike. A **small curated seed sample** (a handful of real brands/bikes relevant to the target
   rider — e.g., a few common touring bikes) is researched and seeded now to prove the brand-select
   data path end-to-end, without blocking on full catalog coverage. Any bike without a
   research-verified entry falls back to generic defaults, and the UI shows a visible **"using
   generic defaults"** note whenever no specific bike is selected/matched.
2. **Which brands/bikes to seed, and verification of the actual numbers (Recommendation pending real
   stakeholder sign-off)**: this log does not have the authority to assert real-world brand service
   intervals are accurate — sourcing real brand data (or delegating to a domain expert) is a
   business/content decision, not an engineering one. Fabricated numbers are explicitly unacceptable
   per HEALTH_REQ's header note.

**Rationale**: Full brand-data research is a large, open-ended content workstream disconnected from
the core engineering risk of Health MVP — the business goal (KB §2.1: track wear against a plan) is
already met by generic defaults. Blocking MVP on full brand coverage would delay the primary
Reminders value for a nice-to-have precision layer. Seeding a small real sample now de-risks the
brand-select UX/schema without waiting on the full research effort.

**Status**: Fallback mechanism + note — Decided. Brand list/sourcing — Recommendation pending real
stakeholder sign-off (interim default: ship with generic defaults only if no curated sample is ready
in time; do not fabricate brand-specific numbers under deadline pressure).

---

## D-OQ-H5-SPEND-YEAR — "This year" definition for Spent-this-year

**Date**: 2026-07-17

**Decision**: **Calendar year**, resetting on January 1 (local device date, see D-YEAR-BOUNDARY-TZ
below). The reset affects only the Spend total/top-3 — odometer and all service-item progress are
unaffected.

**Rationale**: "This year" most plainly reads as calendar year, matching common financial-summary
intuition. A rolling 12-month window is more complex to query and less intuitive as a "reset moment"
for the user, for no clear added value.

**Status**: Decided.

---

## D-OQ-G2-MULTI-VEHICLE — Multiple vehicles per user

**Date**: 2026-07-17

**Decision**: **One vehicle in the UI for MVP.** The data schema remains multi-vehicle-ready
(`vehicle_id`-scoped tables per FRAMEWORK_RULES Rule 8.4) even though onboarding/UI only surfaces one
bike; "add another bike" is deferred.

**Rationale**: Multi-vehicle UI (bike switcher, per-bike data isolation surfaced in every screen, add
another bike flow) is meaningful added scope serving a rider segment (multi-bike owners) that is
likely a minority at launch. Keeping the schema vehicle-scoped now avoids an expensive later
migration; deferring the UI avoids paying the UX cost before it's proven needed. This matches
FRAMEWORK_RULES Rule 8.4 exactly — effectively already decided at the framework level, ratified here
for the KB's OQ-G2.

**Status**: Decided.

---

## D-OQ-H9-OIL-FILTER-SEEDING — Oil-change event counter seeding & independent reset

**Date**: 2026-07-17

**Decision**:
- At onboarding (or whenever Oil Filter tracking starts with unknown prior history), the Oil Filter
  event-count baseline defaults to **0 events elapsed** (i.e., "count starts now") — same
  safe-default philosophy as D-OQ-H2-DEFAULT-BASELINE, but applied to the event-count axis where
  there is no reliable way to know how many oil changes have already occurred against the current
  filter.
- Each time **Engine Oil** is marked replaced, Oil Filter's qualifying-event count increments by 1
  (this is the one confirmed coupling per KB §2.2/§2.3).
- Marking **Oil Filter itself** replaced resets its own event-count baseline to 0, independently of
  Engine Oil's own km-based baseline (they are separate items; only the counter mechanism, not the
  baselines, is coupled).

**Rationale**: With unknown pre-existing history, assuming the filter is fresh (0/2) avoids a false
"Overdue" showing on day one — a worse first impression than the (less likely, and self-correcting
within one oil-change cycle) risk of under-counting a filter that was actually close to due. This is
a UX-default judgment call, not a business-critical/monetization/legal call, so it's decided here
rather than escalated.

**Status**: Decided.

---

## D-OQ-H6-H8-NOTIFICATIONS — Notification channel & trigger behavior

**Date**: 2026-07-17

**Decision (interim engineering scope, Decided)**: Health MVP ships as a **pull model only** — no
push notifications. The Service Reminders list, colored meters, and ⚠ icon are sufficient to deliver
the core "what needs attention" value without push.

**Decision (channel + trigger policy, Recommendation pending real stakeholder sign-off)**: Which
channel(s) (in-app only vs. also email/SMS — OQ-H6) and which state transitions fire a notification
(OQ-H8: every transition, or only entering Replace/Overdue) are genuinely product/business calls with
cost (SMS/email infra) and retention-strategy implications this log cannot make unilaterally.

**Rationale**: Building push ahead of a settled channel + trigger policy risks throwaway
implementation work (FRAMEWORK_RULES Rule 3.5 requires server-side scheduling infra regardless of
channel — better built once, correctly, after the policy is confirmed). Deferring push entirely does
not block Health MVP's core value.

**Status**: No-push-in-MVP — Decided. Channel + trigger policy — Recommendation pending real
stakeholder sign-off.

---

## D-OQ-H7-METRIC-LIST — Final MVP metric list

**Date**: 2026-07-17

**Decision (interim engineering default, Recommendation pending real stakeholder sign-off)**: Ship
HEALTH_REQ §6's full generic-default list as MVP seed metrics — Chain lube, Engine oil, Oil filter,
Front brake pads, Rear brake pads, Spark plug, Chain replacement, Tires, Air filter, Fuel filter,
Coolant, Brake fluid, Clutch plates (13 items) — **excluding Battery**, which KB §2.2 mentions as a
suggested extension but has no generic-default interval defined anywhere yet (no reasonable
distance/time default exists without brand data — e.g., battery life is usage/climate-dependent in a
way mileage-based parts aren't). Battery tracking can be added post-MVP once a sensible default or
brand data exists, since metrics are extensible rows, not a fixed enum (Rule 8.3) — adding it later
is cheap.

**Rationale**: Only 4 metrics are KB-§2.2-"confirmed" (odometer, coolant, engine oil, oil filter);
the rest are "suggested, needs confirmation." However, shipping only 4 delivers materially less
real-world value — most riders' immediate maintenance concerns are brake pads, tires, and chain, all
already researched to generic-default intervals in HEALTH_REQ §6. Since extensibility means seeding
more rows costs nothing architecturally, the practical choice is between "ship a useful default set"
and "ship a token 4-item set that under-serves the stated business goal (KB §2.1)." That said, which
metrics are business-appropriate to show *by default* (vs. user-added later) genuinely shapes the
app's first impression and value proposition, so this is flagged pending real confirmation rather
than silently finalized.

**Status**: Recommendation pending real stakeholder sign-off. Interim default (13-item list above) is
usable for build/test now so work isn't blocked; treat as provisional.

---

## D-UNIT-ROUNDING — Display rounding rule for km/mi conversion

**Date**: 2026-07-17

**Decision**: All distance displays (odometer, remaining km/mi, "due in X") round to the **nearest
whole unit** (no decimals) in the unit currently displayed. Canonical storage is always km
(HEALTH_REQ §8); a manual odometer edit entered in miles is converted to km and **stored rounded to
the nearest whole km** before persisting.

**Rationale**: Neither HEALTH_REQ nor the KB specifies a rounding precision, and acceptance criteria
need one to be testable (e.g., 40,355 km × 0.621371 = 25,075.43 mi — must render as a single
unambiguous value). Whole-unit rounding matches how riders actually read an odometer (no bike displays
tenths of a km on the dash) and keeps the conversion formulas in HEALTH_REQ §8 exactly as specified,
just closing an implementation gap.

**Status**: Decided. (Small addition beyond the requested decision set — flagged here because it's
needed to make the km/mi acceptance criteria concrete and testable; low-risk formatting choice within
product-owner discretion.)

---

## D-YEAR-BOUNDARY-TZ — Timezone basis for the Jan-1 Spend reset

**Date**: 2026-07-17

**Decision**: The "new calendar year" boundary for Spent-this-year (D-OQ-H5-SPEND-YEAR) is based on
the **user's device local date**, not UTC.

**Rationale**: A rider whose local Jan 1 hasn't arrived yet in UTC (or vice versa) would see a
confusing early/late reset if the boundary were UTC-based. Device-local date matches the user's own
sense of "it's a new year now." This is a small implementation gap not addressed in HEALTH_REQ,
closed here so QA has an unambiguous boundary to test against.

**Status**: Decided.
