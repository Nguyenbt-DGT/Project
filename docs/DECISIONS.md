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

---

## D-DEMO1 — Demo-feedback round 001 changes

**Date**: 2026-07-18. Source: `docs/DEMO_FEEDBACK_001.md`.

**Decisions**:

1. **Section order (was value-emphasis → now display order)**: the Health tab renders **Live Vitals
   → Service Reminders → Spent this year** (feedback #3), superseding the earlier
   Reminders→Spend→Vitals emphasis order in HEALTH_REQ §1 / D-HEALTH-MVP-SCOPE. Service Reminders is
   still the primary-value section; only the on-screen order changed.
2. **Theme**: adopt the "Night Garage" look (dark warm canvas + orange accent + lime "healthy"),
   from `design/prototype/Night Garage.html` / `design/images/health.png` (feedback #1). Palette is
   shared in `src/theme.ts`.
3. **Onboarding is now built** (feedback #2): first-login users with no vehicle are routed to an
   onboarding flow (language, bike name/brand, mileage + unit, recently-changed checklist) that
   calls the `onboard_vehicle` RPC. **Reconciles D-OQ-H2's internal contradiction** — its decision
   sentence ("baseline = current odometer for non-changed") conflicted with its own rationale and
   GLOBAL_REQ §2's acceptance criterion (which imply non-changed parts are *not* at 0%). Resolved in
   favor of the rationale + GLOBAL_REQ AC: **recently-changed parts start Fresh (0%); not-changed km
   parts use baseline 0 (reflecting accumulated km-wear, so the checkbox is meaningful). Time-axis
   parts start the clock at onboarding (baseline = now) either way — there is no past-service-date
   signal to reflect.** This makes the "recently changed" selection visibly matter.
4. **Undo "mark as replaced"** (feedback #5.4): added an append-only `service_events` snapshot log;
   `mark_service_done` records the pre-mark baseline (and coupled oil_filter count), and
   `undo_last_service` reverses the most recent not-yet-undone mark. Undo restores the **wear
   baseline** only — a price/spend entry recorded alongside a mark is intentionally not reverted
   (see KNOWN_ISSUES).
5. **Mark-as-replaced UX** (feedback #5.1–5.3): a Yes/No confirmation precedes the mark; on Yes a
   toast shows the part name with an Undo action; on No nothing happens.
6. **Permission notice** (feedback #4): a location-permission notice is shown on app access when
   foreground location isn't granted, explaining why and offering to request it.
7. **Spend details** (feedback #6): the Spent-this-year summary is tappable, opening an itemized
   list of the year's spend entries. (This partially un-defers the "full Spend-details page" from
   D-HEALTH-MVP-SCOPE — a read-only itemized list now ships; historical/multi-year browsing is
   still deferred.)

**Status**: Decided (engineering scope for the demo-feedback round). Genuinely business-critical
items remain as previously flagged (final metric list, notification channel, brand-data sourcing).

---

## D-DEMO1-CICD — CI/CD via GitHub Actions (not Render)

**Date**: 2026-07-18. Source: user request ("update the CI/CD flow from Render to GitHub Actions").

**Decision**: CI/CD runs on **GitHub Actions** (`.github/workflows/ci.yml` + `deploy.yml`), not a
Render dashboard auto-deploy. CI runs typecheck, lint, unit tests, and the DB/RLS/RPC suite (with a
generated-types drift check) on every push/PR. CD deploys from `main` only (Supabase `db push`;
app via EAS) and is **inert until** repo variable `DEPLOY_ENABLED=true` and the deploy secrets are
set. Render remains available only as an optional *host* for custom backend services (Rule 5.1);
when such a service exists it is deployed by this pipeline, not by Render's own hook. FRAMEWORK_RULES
Rule 5.5 / 7.4 updated accordingly.

**Rationale**: One pipeline (already the home of CI) owning both test and deploy keeps the release
path in version-controlled workflow files, avoids a separate Render-managed deploy surface, and lets
deploys gate on green CI.

**Status**: Decided.

---

## D-DEMO2 — Demo-feedback round 002 changes

**Date**: 2026-07-18. Source: `docs/DEMO_FEEDBACK_002.md`.

**Decisions**:

1. **English/Vietnamese switching** (feedback #1, resolves KI-5): a lightweight app-level i18n —
   `src/i18n.tsx` holds the current `Language` in context (persisted via `expo-secure-store` on
   native; in-memory fallback on web per KI-1). Each label in `logic/labels.ts` carries its English
   (`fallback`) and Vietnamese (`vi`) text **inline** (no separate key→translation map, so coverage
   is enforced at the type level and unit-tested). Components resolve text via a `useT()` hook
   instead of reading `.fallback`, so switching re-renders immediately. An EN/VI toggle sits on the
   Health tab; the onboarding language picker is bound to the same app-wide language.
   - **No i18n library** was added — the app has a small, fixed string set, so an inline two-language
     map is simpler than pulling in i18next/expo-localization and its config.
2. **"Last service" checkpoint editor** (feedback #2): the per-part **detail sheet** gains a
   "Last service (odometer)" field for km-based items — the user sets the odometer value the next
   service is counted from (e.g. odo 35k, last service 29k → next due at 29k + interval). It's a
   direct owner-scoped `service_items.last_service_km` write (same pattern as the price update; no
   RPC needed, Rule 4.5), validated 0..current-odometer in the UI.
   - **Interpretation note**: the feedback said "edit odometer function," but `last_service` is
     per-part (it drives each part's next-service), so a single vehicle-level field can't express it
     coherently. It therefore lives in the per-part detail view, not the vehicle-level edit-odometer
     modal. Flag if a different placement was intended. Not undoable (see KNOWN_ISSUES KI-8).

**Note on persistence dependency**: language persistence uses the already-present `expo-secure-store`
rather than adding `@react-native-async-storage/async-storage` — see D-SDK54 for why (adding it
disturbed the SDK pin).

**Status**: Decided.

---

## D-SDK54 — Pin Expo SDK 54 (target-device requirement)

**Date**: 2026-07-18. Source: user ("my phone cannot use SDK 57 — use SDK 54").

**Decision**: The project is pinned to **Expo SDK 54** (`expo@~54`, `react-native@0.81.5`,
`react@19.1.0`, `typescript@~5.9`, `eslint-config-expo@~10`, `jest-expo@~54`, SDK-54 `expo-*`
modules). Do not upgrade to SDK 57+. FRAMEWORK_RULES Rule 0.3 records this as binding.

**Rationale / history**: A target device cannot run SDK 57 builds. During DEMO_FEEDBACK_002,
`npx expo install @react-native-async-storage/async-storage` moved the project to SDK 54; I first
misread that as an accident and reverted to 57, but SDK 54 is in fact the required target — so the
project was moved back to SDK 54 deliberately and pinned. Language persistence uses the SDK-54
`expo-secure-store` module instead of AsyncStorage, avoiding the extra native dependency whose
install perturbed the SDK version in the first place. All gates pass on SDK 54 (tsc, eslint,
79 Jest + 38 Vitest DB tests, web bundle build).

**Status**: Decided.

---

## D-DEMO3 — Demo-feedback round 003: keyboard fix, translations, tabs, and hosted-app roadmap

**Date**: 2026-07-18. Source: `docs/DEMO_FEEDBACK_003.md` + two mid-turn user requests (a
developer tutorial for iOS access; moving off local-only hosting for "the next version").

**Decisions**:

1. **Keyboard covering modal inputs** (feedback #2, confirmed via `Item_Bug_1.png`): fixed in
   `service-item-detail-sheet.tsx`, `edit-odometer-modal.tsx`, and `onboarding-screen.tsx` with
   `KeyboardAvoidingView` (+ an inner `ScrollView` for the detail sheet, whose bottom sheet is tall
   enough to otherwise get pushed off-screen). Genuine bug, not a scope question — implemented directly.
2. **Part-name translation** (feedback #1): the Service Reminders cards, the onboarding
   recently-changed checklist, and the Spend fallback names were all rendering the raw English
   `service_items.name` / `part_type_defaults.name` from the database regardless of language. Fixed
   with a `type_key -> Vietnamese name` map (`logic/part-names.ts`) applied at display time —
   translation stays a frontend concern (Rule 1.3) rather than duplicating localized columns in the
   extensible `part_type_defaults` catalog (Rule 8.3: custom/user-added parts keep whatever name was
   entered for them, since there's no translation available). **Caveat**: the 13 Vietnamese terms are
   drafted by AI, not verified by a native speaker — same caveat as other AI-drafted content in
   HEALTH_REQ; flag for business-analyst review.
3. **Persistent "edit vehicle" entry point** (feedback #4): added a tappable vehicle-name button
   (with a pencil icon) in the Health header, opening an edit sheet for name/brand/unit via a new
   `useUpdateVehicle` mutation (plain owner-scoped table write, Rule 4.5 — no cross-table invariant,
   no RPC needed). This is additive to onboarding, not a replacement — I audited `app/index.tsx`'s
   routing and found no bug: fresh users are correctly routed to `/onboarding` when they have no
   vehicle. The demo tester most likely used the seeded `rider@example.com` account, which already
   has a vehicle from `seed.sql` and so never sees onboarding — expected behavior, not a defect. The
   new header entry point makes bike info reachable regardless of which path a user came in through.
4. **Tabs restructured** (feedback #5): Touring's placeholder now reads a localized "Feature coming
   soon" (shared `ComingSoonScreen` component). The 3rd tab ("Tracking") is **renamed to "Lucky
   Draw"** with the same coming-soon placeholder, per explicit instruction ("this is not a feature of
   this app"). `app/(tabs)/map-tracking.tsx` was deleted and replaced by `app/(tabs)/lucky-draw.tsx`,
   which does NOT import from `src/features/map-tracking/` — that feature module is left untouched
   and simply has no tab pointing to it anymore.
   - **Flag for business-analyst/product-owner**: MAP_TRACKING is one of the KB's three core
     functions (KB §4). This change removes its only navigation entry point in favor of a
     non-business placeholder tab. I implemented it as instructed (the message came directly from the
     real stakeholder, not a simulated one, so Rule 8.2's "don't guess business behavior" doesn't
     block acting on it) — but the KB itself has not been updated to reflect MAP_TRACKING's
     deprioritization or wherever it's meant to resurface in navigation (a 4th tab? merged into
     Touring? a future replacement of "Lucky Draw" once GPS tracking is built?). That reconciliation
     is still open.
5. **"App re-downloads every time" (feedback #3) + "host it online, no local port" (mid-turn
   request)**: same root cause — the app currently runs against a **local** Supabase stack and an
   Expo Go **tunnel** dev server, both of which must be started fresh each session and both of which
   require Expo Go to re-fetch the JS bundle on every cold open. The actual fix is not a code change
   inside this repo; it's an operational move to (a) a **hosted Supabase project** instead of local
   Docker, and (b) a **real installed app** (via EAS Build, distributed through TestFlight for iOS)
   instead of Expo Go. Both are documented step-by-step in `docs/GUIDELINE.md` §8, and the
   groundwork is committed now: `eas.json` (development/preview/production build profiles),
   `ios.bundleIdentifier` / `android.package` placeholders in `app.json` (`com.motocompanion.app` —
   change before your first App Store Connect upload, since it can't change after), and a
   `.env.example` note on swapping to hosted Supabase values.
   - **Why not fully executed**: creating a Supabase cloud project, an Expo/EAS account, and (for
     iOS) an Apple Developer Program membership ($99/yr) all require the user's own accounts,
     payment, and identity — an AI agent cannot create or hold these. This is accurately scoped as
     "config + documentation now, execution next" rather than claiming a fix that doesn't exist yet.

**Status**: Decided (engineering scope for the demo-feedback round). Item 4's flag (MAP_TRACKING's
nav placement) and item 2's translation-accuracy caveat are open items for business-analyst /
product-owner, not blocking. Item 5's hosted-app move is documented but requires the user to
execute the account-creation steps in GUIDELINE.md §8 themselves (or with my help interactively,
once they have the accounts).

---

## D-CI-NODE22 — CI requires Node 22+ (not 20)

**Date**: 2026-07-19. Source: user-reported CI failure (screenshot of a failed GitHub Actions run).

**Decision**: Both CI jobs (`quality`, `database` in `.github/workflows/ci.yml`) and the commented
EAS-build job in `deploy.yml` are pinned to **Node 22**, not 20.

**Rationale**: `@supabase/supabase-js` initializes a realtime client (even for plain REST/RPC
calls), which requires a native `WebSocket` global — available in Node from v22 onward, not v20.
The `database` job's Vitest suite failed every test with "Node.js detected but native WebSocket not
found" as soon as any test called `createClient(...)`. Local development had never hit this because
this environment already runs Node 24; CI was the only place still on 20. Bumped `quality` to 22 as
well to avoid future drift between the two jobs.

**Status**: Decided.

---

## D-HOME-DEEP-IMPORT — Rule 1.2 carve-out for pure `logic/` modules

**Date**: 2026-07-19. Source: build-time discovery while wiring the new `home` feature to reuse
health-check's wear-status math.

**Decision**: FRAMEWORK_RULES Rule 1.2 now permits deep-importing a feature's pure, side-effect-free
`logic/` module directly (e.g. `@/features/health-check/logic/status`), instead of requiring
everything to go through that feature's `index.ts` barrel.

**Rationale**: `home`'s health-score logic needs the exact same wear-status math the Health tab
uses (`axisResultsForItem`, `worstAxisResult`, etc.) — reusing it, not reimplementing it, so the two
tabs can never disagree about a part's status. Re-exporting those functions from
`health-check/index.ts` seemed like the "proper" Rule-1.2-compliant path, but barrel-file imports
evaluate the ENTIRE module top-to-bottom regardless of which export is used — since that index.ts
also exports `HealthCheckScreen`, any consumer (including a plain Jest test for pure logic) was
forced to transitively load React Native screen code and its native `expo-font`/`@expo/vector-icons`
dependency chain, which fails to resolve outside the app runtime. `health-score.test.ts` reproduced
this exactly: it failed with a module-resolution error despite never touching React itself.

**Status**: Decided.

---

## D-DEMO4 — Demo-feedback round 004 changes

**Date**: 2026-07-19. Source: `docs/DEMO_FEEDBACK_004.md` + `docs/HOME_REQ.md`.

**Decisions**:

1. **Language-aware currency** (feedback #1): a new `logic/currency.ts` formats amounts as USD in
   English and VND in Vietnamese, converting via a fixed placeholder rate — see
   `D-DEMO4-CURRENCY` below. Canonical storage stays USD cents everywhere (no schema change),
   matching the existing "one canonical unit, convert at the edges" pattern already used for
   distance (`D-UNIT-ROUNDING`). Applied to every amount display (Spend summary/details, Service
   Reminders running total, part detail price) and to price *input* parsing (mark-as-replaced,
   the new direct price editor) — a Vietnamese-language user types VND, not USD.
2. **Spend items not translating** (feedback #2) — root-caused, not a stale-cache issue: every
   seeded/typical spend entry has an English `note` (e.g. "Chain replacement"), and `displayName()`
   checked `note` *before* the translatable part name, so the translated path never actually ran.
   Fixed by reordering: a recognized `part_type_key` (translatable) now takes priority; the note is
   shown as a secondary caption in the details sheet when it exists alongside a part name, so no
   information is lost.
3. **Editable interval/last-service/price in the Part Details popup** (feedback #3): added a
   general-purpose `useUpdateServiceItem` mutation (supersedes the narrower `useSetLastServiceKm`)
   and inline "Edit interval" / "Edit last service" (now covering all three axes — km, days-ago,
   event-count, not just km) / "Edit price" rows in the detail sheet. These edits deliberately do
   **not** close the sheet (unlike mark-as-replaced), since a user may want to fix several fields
   in one visit. Editing price here is a direct correction to `service_items.price_cents` and does
   **not** create a new `spend_entries` row — that stays tied to the mark-as-replaced flow only, to
   avoid double-counting spend.
4. **HOME tab** (feedback #4, `HOME_REQ.md`): new leftmost tab, shown immediately after
   login/onboarding instead of the Health tab. A `home` feature was added following the same
   structure as `health-check` (Rule 1.1). Key implementation choices:
   - **Vehicle hero card** (§3.1): tapping the photo area picks/uploads a new photo (via
     `expo-image-picker` + a new `vehicle-photos` Supabase Storage bucket, owner-scoped RLS —
     migration `20260719080000_home_vehicle_photo.sql`, verified live); tapping the rest of the
     card opens a read-only details popup. The eyebrow text becomes the real app name; the circular
     badge becomes the bike's name, per §3.1.2/§3.1.3.
   - **Merged stats/health card** (§4): the mockup's separate Total-Distance and Bike-Health cards
     become one tappable card that navigates to the Health tab. "This month" sums recorded trips in
     the current calendar month (new `useMonthDistanceKm`, same shape as health-check's existing
     `useTodaysDistanceKm`). See `D-HOME-HEALTH-SCORE` for the score formula and status-message
     wording, both explicitly left to us by HOME_REQ.
   - **Scope note**: the full Home.png mockup also shows a red "part overdue" alert card and
     "Plan a Ride"/"Lucky Draw" CTA buttons, neither of which HOME_REQ's numbered requirements ask
     for. Deliberately not built (Rule 8.2 — don't add unrequested scope even when a reference
     mockup shows it); flagged as an open enhancement for product-owner in `KNOWN_ISSUES`.
   - **"Last ride" caption depends on MAP_TRACKING data that doesn't exist yet**: with no ride-
     recording feature built, the `trips` table has no real rows for actual users (only seed
     fixtures), so the hero card will show "No rides recorded yet" for every real user until
     MAP_TRACKING ships. This is expected, not a bug — flagged in KNOWN_ISSUES for visibility.

**Status**: Decided (engineering scope for the demo-feedback round). See `D-DEMO4-CURRENCY` and
`D-HOME-HEALTH-SCORE` immediately below for the two judgment calls this round required.

---

## D-DEMO4-CURRENCY — Placeholder USD→VND rate (not a live FX rate)

**Date**: 2026-07-19. Source: DEMO_FEEDBACK_004 #1.

**Decision**: `logic/currency.ts` uses a fixed, illustrative rate of **1 USD ≈ 25,000 VND** to
convert canonical USD-cent storage into a Vietnamese-language display (and to parse VND input back
into cents). This is **not** a live/authoritative foreign-exchange rate.

**Rationale**: A real exchange rate requires a genuine product/business decision (which FX data
provider, how often it refreshes, whether a rate is locked at the moment of a transaction vs. always
using "today's" rate) — none of that exists yet, and inventing it would be guessing a business
behavior (Rule 8.2). A fixed, clearly-documented placeholder unblocks the feature (users see
sensible VND amounts, VND input round-trips correctly) while being honest that it's illustrative.
Flagged in `KNOWN_ISSUES` for product-owner/business-analyst to replace with a real rate source
before this ships to real Vietnamese users handling real money.

**Status**: Decided (interim). Real FX sourcing: pending stakeholder decision.

---

## D-HOME-HEALTH-SCORE — Bike-health score formula, status messages, and ring simplification

**Date**: 2026-07-19. Source: HOME_REQ.md §4.2 ("Displays the Average of the Bike's health... The
content of each status I let you decide").

**Decision**:
1. **Score formula**: `home/logic/health-score.ts` averages every tracked item's *clamped* progress
   (0–100%, the same clamping the Health tab's wear meters already use) and inverts it into a 0–100
   "freshness" score (`100` = everything just serviced, `0` = everything maximally overdue). Items
   with no configured axis are excluded from the average (never treated as 0% or counted as a
   phantom entry). An empty item list scores 100/fresh.
2. **Status (color)**: the **worst** individual item's status, never averaged/diluted — mirrors the
   existing dual-axis "worst wins" rule (`D-OQ-H3-TIME-DUAL-AXIS`) so one badly neglected part can't
   be hidden behind several fresh ones.
3. **Status messages** (four, EN+VI): "Running strong — nothing needs attention" (fresh) / "Mostly
   good — keep an eye on upcoming service" (due_soon) / "Running strong — one thing needs your
   wrench" (replace, matching the mockup's own wording) / "Needs attention — something is overdue
   for service" (overdue).
4. **Ring → flat circle → true ring (superseded)**: originally implemented as a flat colored circle
   to avoid adding `react-native-svg` as a new dependency. **Reversed in DEMO_FEEDBACK_005** — the
   user explicitly asked for the real progress ring ("only the process chart has color"), so
   `react-native-svg@~15.12.1` (confirmed Expo-54-compatible) was added and `HealthRing`
   (`src/features/home/components/health-ring.tsx`) now draws a true SVG arc: a faint full-circle
   track + a colored arc sized to `score/100`, starting at 12 o'clock. Only the arc carries the
   status color — the center background and score text stay neutral, matching the reference image.

**Status**: Decided (reasonable default per HOME_REQ's explicit delegation for the formula/wording).
The ring-vs-circle question is now resolved in favor of the true ring.

---

## D-DEMO5 — Demo-feedback round 005 + mid-turn requests (engineering scope)

**Date**: 2026-07-19. Source: `docs/feedbacks/DEMO_FEEDBACK_005.md` plus three mid-turn requests
(the health-score ring reversal, above; brand/name dropdowns; this summary).

**Decisions**:

1. **Photo not showing after upload (feedback #1) — root-caused, fixed.** The original upload path
   read the picked file via `fetch(localUri).blob()`, which is unreliable for local `file://` URIs
   across React Native environments — the upload call could resolve without error while writing an
   empty/corrupt Storage object, so nothing ever rendered. Fixed by switching to `expo-file-system`'s
   modern `File` class (`file.bytes()` for the raw bytes, `file.size` for a size check) — a
   native-module-backed read, not a fetch-polyfill one. The bucket's existing 10 MB limit
   (`file_size_limit` in the storage migration) is now **also enforced client-side** with a clear
   `PhotoTooLargeError`, so an oversized photo fails fast with a specific message instead of a
   silent/generic upload failure.
2. **Bike-name mismatch between Home and Health (feedback #6) — hardened, not strictly
   root-caused.** Both screens read the exact same TanStack Query cache entry
   (`VEHICLE_QUERY_KEY`), and `useUpdateVehicle` already invalidates it on save, so the two tabs
   *should* agree under React Query's own defaults. Rather than rely on that theoretical guarantee,
   `HomeScreen` now explicitly invalidates the vehicle and service-items queries on every
   `useFocusEffect` (screen focus) — cheap, and removes any doubt about mount/staleness timing
   specific to how Expo Router's tab navigator keeps screens alive.
3. **Cross-tab profile entry point (feedback #5)**: a header button on the shared
   `app/(tabs)/_layout.tsx` `screenOptions` (so it appears on every tab without per-screen wiring),
   opening a popup with the signed-in email and a sign-out action. Sign-out clears the entire React
   Query cache (`queryClient.clear()`) and explicitly navigates to `/(auth)/sign-in` — it does not
   rely solely on `app/index.tsx`'s auth-state listener, since that component may not be mounted
   when sign-out happens from deep inside a tab. Profile *editing* needs a real user-data model; the
   Turso migration that would have bundled this is declined (`D-DEMO5-TURSO`), so this stays
   read-only for now (GLOBAL_REQ §4) pending a Supabase-backed `profiles` table.
4. **Overdue-parts warning list (feedback #7)**: a new `computeOverdueParts` pure function
   (deep-imports health-check's `logic/status`, `logic/labels`, `logic/part-names` — the same Rule
   1.2 carve-out `health-score.ts` already uses) lists every item whose status is `overdue`, worst
   first, reusing the exact "Overdue {value} — replace/repair as soon as possible" copy already
   shown on the Health tab (no second copy of the same message to drift). Hidden entirely when
   nothing is overdue. Scrolls internally past 3 rows rather than growing the page.
5. **Touring / Lucky Draw nav cards (feedback #8)**: two cards navigating to their respective tabs,
   matching `Home-5th-session.png`. Both destinations are still "Feature coming soon" placeholders
   (`D-DEMO3`) — this only adds the navigation shortcut, not the underlying features.
6. **Brand/name dropdowns in the vehicle editor** (mid-turn: "since we have database now, brand and
   name should be dropdowns"): the Health tab's Edit Vehicle modal's Brand and Name fields are now
   cascading dropdowns sourced from `bike_catalog` (the same small curated table from `D-OQ-H4`),
   with a free-text "Other" fallback — the catalog only has 4 rows, so a strict dropdown-only field
   would trap any user whose bike isn't one of them. This does **not** yet wire a selected catalog
   bike into `bike_part_intervals` overrides (HEALTH_REQ §6.1 tracks that gap explicitly) — today
   it only sets `vehicles.brand`/`vehicles.name`.
7. **Health-score ring reversal**: see the amended note in `D-HOME-HEALTH-SCORE` above.

**Status**: Decided (engineering scope for this round). Item #2 of the original feedback (database
migration to Turso) was reviewed and then **declined — Supabase stays**; items #3–#4 (custom
Login/Logout/Register, user-data handling) remain open, now scoped against Supabase instead. See
`D-DEMO5-TURSO`.

---

## D-DEMO5-TURSO — Declined: Supabase → Turso migration (staying on Supabase)

**Date**: 2026-07-19, reversed 2026-07-18[^note]. Source: DEMO_FEEDBACK_005 #2–#4 ("I think we
should change the database provider from supabase to Turso... we need to implement
Login-Logout-Register... we will handle the user's data in the database"). The user paused this
migration to review the architectural implications, and after seeing the analysis below
**explicitly decided to keep Supabase** ("Please keep the supabase") rather than proceed. Nothing
in this entry was ever built — it is kept as a record of the analysis and the decision it led to,
so the same migration isn't re-proposed without re-deriving why it was declined.

[^note]: Dates as given in-session; the reversal message arrived shortly after the pause.

**Outcome**: Feedback item #2 (change database provider to Turso) is **declined**. Supabase remains
the database, Auth, and Storage provider for this app — no Turso, no custom backend API, no
Render service, no Cloudflare R2. The four "architecture decisions" recorded below never take
effect; they're kept for context only, in case a similar migration is proposed again later.
Items #3–#4 (Login/Logout/Register, user-data handling) are **not** cancelled by this — they were
only *bundled* with the Turso move in the original feedback, not dependent on it. Whether/how to
build them against Supabase instead is tracked separately (see the "Next" note at the end of this
entry).

**Why this isn't a small change**: Supabase today provides four things this app depends on, not
just "a database" — Postgres (schema, RLS, RPCs), Auth (Gmail/email sessions), Storage (the
vehicle-photos bucket), and a client library safe to call directly from the mobile app because RLS
enforces per-row authorization at the database layer. Turso is a hosted **libSQL/SQLite-compatible
database only** — no RLS-equivalent row-security model, no built-in Auth, no file storage. Moving
the data there is not a connection-string swap; it changes the whole security model:

- **No RLS-equivalent** → a mobile client cannot safely hold a Turso auth token with unrestricted
  table access the way it safely holds a Supabase anon key today. This effectively **requires a
  custom backend API** between the app and Turso (e.g., on Render — already an available option
  per Rule 0.2/5.1) that owns authorization, which the client calls over HTTPS instead of talking to
  the database directly.
- **No built-in Auth** → explains DEMO_FEEDBACK_005 #3 ("we need to implement Login-Logout-Register
  ourselves"). This means designing session handling from scratch (password hashing, session
  tokens/JWTs, refresh, "remember me") — a real architecture decision, not a library swap.
- **No Storage** → the vehicle-photo feature (`D-DEMO5` #1, just fixed) needs a different home for
  uploaded files — Turso doesn't store blobs. Options: keep Supabase Storage as a standalone service
  even if Postgres data moves to Turso, or adopt a separate object-storage provider (Cloudflare R2,
  S3, Vercel Blob, etc.).
- **Schema dialect**: existing migrations use Postgres-specific features (RLS policies, `gen_random_uuid()`,
  Postgres functions/triggers for `mark_service_done`/`apply_trip_distance`/etc.) that don't
  translate directly to SQLite/libSQL — every migration and RPC would need rewriting, not just
  re-pointing.

**Architecture decisions (made 2026-07-19, via AskUserQuestion)**:

1. **Scope: full replacement.** Data, auth, and file storage all move off Supabase — not the
   hybrid "Turso for app data only, keep Supabase Auth/Storage" option, which would have been lower
   risk/rework. This is the user's explicit choice, not a default.
2. **Auth mechanism: custom email/password.** Bcrypt-hashed passwords in a new Turso `users` table;
   JWT session tokens with refresh; "remember me" semantics handled by the new backend API. This
   supersedes GLOBAL_REQ §1's Gmail-OAuth business requirement for the time being — whether Gmail
   sign-in is layered on top of this later, or replaced by it, is not yet decided; flag to
   product-owner/business-analyst once this bundle is actually built.
3. **Backend hosting: Render.** Already an approved fallback per FRAMEWORK_RULES Rule 0.2/5.1 — no
   new hosting-provider decision needed. This is the first feature that actually triggers Rule 5.1's
   "only if/when needed" condition; `/server` moves from dormant to active.
4. **Photo storage: Cloudflare R2.** S3-compatible API (existing AWS S3 SDKs work unmodified against
   it), no egress fees, generous free tier. Replaces the Supabase Storage `vehicle-photos` bucket
   (migration `20260719080000_home_vehicle_photo.sql`) once this bundle is built.

**What's still needed to resume**:
1. The Turso database URL and auth token — retrieval steps given directly to the user in chat, per
   their request (not duplicated here since credentials don't belong in a committed doc).
2. Cloudflare R2 credentials (account ID, access key ID/secret, bucket name) — needed once the
   photo-storage piece of this bundle is actually reached, not immediately.
3. A rewrite of every migration/RPC from Postgres dialect (RLS policies, `gen_random_uuid()`,
   Postgres functions/triggers) to SQLite/libSQL — Turso has no equivalent of any of these.
4. Design of the new Render backend API's route surface (what the mobile app calls instead of
   talking to a database directly) and the JWT session contract (issuance, refresh, storage on
   the client — still `expo-secure-store`, that part is unaffected by the backend swap).

**Status**: **Declined.** No Turso database URL/token will be requested; the retrieval steps given
to the user in chat are moot. Supabase continues as-is (Postgres + RLS + Auth + Storage).

**Next**: see `D-DEMO5-AUTH` — items #3–#4 were built against Supabase in the same round this
decision was reversed.

---

## D-DEMO5-AUTH — Login/Register/Logout + user-data model, built against Supabase

**Date**: 2026-07-19. Source: DEMO_FEEDBACK_005 #3–#4, unblocked once `D-DEMO5-TURSO` declined the
Turso move. Confirmed via `AskUserQuestion` ("build both now") rather than guessed, since scope was
genuinely ambiguous (email/password vs. Gmail, what user-data fields) — Rule 8.2.

1. **Login** (`app/(auth)/sign-in.tsx`) and **Register** (`app/(auth)/sign-up.tsx`) are real
   screens against Supabase Auth (Rule 4.3), replacing the earlier dev-only stub (hardcoded
   `rider@example.com` credentials, "TEMPORARY" comment). Register captures an optional display
   name and passes it as sign-up metadata (`options.data.display_name`); handles the
   `enable_confirmations = false` local-dev path (immediate session) and the hosted-project path
   (email confirmation required, no session yet — shown a "check your email" screen) with the same
   code, since `config.toml`'s local setting doesn't reflect what a real deployed project will use.
   **Logout** already existed via the profile popup (`D-DEMO5` #3) — nothing new needed there.
2. **User-data model** (`profiles` table, migration `20260719090000_create_profiles.sql`): one row
   per auth user (`id` FK to `auth.users`, `display_name`), owner-only RLS (select/update — no
   client-side insert/delete policy), auto-created by a `handle_new_user()` trigger on every
   `auth.users` insert (Rule 4.5 — the invariant lives in the database, so it covers Register today
   *and* any future sign-up path, e.g. Gmail OAuth, uniformly). An `updated_at` trigger keeps edits
   timestamped. Scope deliberately kept to just `display_name` — avatar/other fields weren't
   requested; adding them later is an additive migration, not a redesign.
3. **Profile popup** (`src/components/profile-popup.tsx`) now shows and lets the user edit their
   display name inline (tap to edit, Save button), backed by new `useProfile`/`useUpdateProfile`
   hooks in `src/hooks/use-current-user.ts`. Resolves `KNOWN_ISSUES.md` KI-17.
4. **DB test coverage** (`tests/db/profiles.test.ts`, Rule 6.5): trigger fires on sign-up (with and
   without metadata), the seeded user has a profile row, owner can edit their own row, and RLS
   blocks cross-user read/update/anon access — same shape as the existing `tests/db/rls.test.ts`.

**Known gap, not silently swept**: GLOBAL_REQ §1 (OQ-G1) documents Gmail-only sign-in as the MVP
business requirement; this round shipped email/password instead, without reconciling that
conflict — flagged as `KNOWN_ISSUES.md` KI-18 for product-owner, not decided here.

**Status**: Implemented and verified — `tsc`, `eslint`, `jest` (103 tests), `db reset`, `test:db`
(45 tests across 6 files, including the new `profiles.test.ts`), and `expo export --platform web`
all pass.

---

## D-DEMO6 — Demo-feedback round 006 (bug fixes)

**Date**: 2026-07-19. Source: `docs/feedbacks/DEMO_FEEDBACK_006.md`, items #1–#3 (a sharing/deployment
question, #4, is answered directly — see GUIDELINE.md §8, not a code change).

1. **Header/status-bar overlap** (`app/onboarding.tsx` via `onboarding-screen.tsx`,
   `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`): none of these three standalone (no native
   header) screens accounted for the device safe area, so the "NIGHT GARAGE" brand text could render
   under the status bar/notch. Fixed with `useSafeAreaInsets()` (`react-native-safe-area-context`,
   already a transitive Expo Router dependency) added as `paddingTop: insets.top + SPACING.xl`. The
   tab screens (Home/Health) were never affected — they render under `Tabs`' native header, which
   already respects the safe area.
2. **Onboarding odometer field sizing** (`onboarding-screen.tsx`): the km/mi segmented toggle was
   visually dominant and the number input tiny — the opposite of the intended "field big, unit toggle
   small." Root cause: the `compact` variant only set `alignSelf: 'flex-start'` on the segmented
   container, which controls cross-axis (vertical) sizing in a row, not main-axis width — it had no
   effect on how wide the toggle rendered next to the `flex: 1` input. Fixed by making the compact
   container explicitly non-growing (`flexGrow: 0, flexShrink: 0`) and its segments non-growing too
   (new `segmentCompact` style), so sizing no longer depends on an ambiguous Yoga default.
3. **Home/Health blank immediately after onboarding** (`use-onboard-vehicle.ts`): the mutation's
   `onSuccess` only called `invalidateQueries` (unawaited) instead of seeding the cache — Home/Health
   mount immediately on `router.replace('/(tabs)/home')` and both gate their entire render on
   `useVehicle()`'s cached data, which was still the pre-onboarding `null` at that exact moment
   (background refetch hadn't resolved yet), so both screens rendered their "no vehicle yet" empty
   state — Home literally rendered nothing (`<View style={styles.screen} />`) per its comment "index.tsx
   only ever routes here once a vehicle exists." Fixed by calling `queryClient.setQueryData(VEHICLE_QUERY_KEY,
   vehicle)` synchronously in `onSuccess` instead of invalidating, so the cache is correct before
   navigation happens — no race, no flash of empty state.

**`test:db` gate note**: this round's `npx vitest run --config vitest.config.ts` run failed 12/45
tests with `{"message": "name resolution failed"}` on every live Supabase Auth/PostgREST call —
verified via `git stash` (identical 12-failed/2-passed/31-skipped result with none of this round's
changes applied) and GoTrue's own container logs (no incoming requests logged for the failing sign-ups,
i.e. the failure is client-side/network-layer in this sandbox, not a server or business-logic
regression) that this is a pre-existing environment condition, not caused by this round. `tsc`,
`eslint`, `jest` (103 tests), `supabase db reset` (all 9 migrations apply cleanly), and
`expo export --platform web` all pass. Tracked as `KNOWN_ISSUES.md` KI-19.

**Status**: Implemented and verified (except the pre-existing `test:db` environment flake above).
