# Moto Companion App — Product Roadmap (4 MVPs)

> **Owner**: product-owner agent · **Status**: Working roadmap, not final — every MVP-3/4 sequencing
> call and every TOURING_PLAN scope item below is a **recommendation pending real
> stakeholder/product-owner sign-off**, per this agent's charter. Items already ratified in
> `docs/DECISIONS.md` (D-*) are cited as decided; everything else is provisional.
> **Ground truth**: `docs/MOTO_APP_KNOWLEDGE_BASE_EN.md` (KB), `docs/features/global/GLOBAL_REQ.md`,
> `docs/features/home/HOME_REQ.md`, `docs/KNOWN_ISSUES.md`, `docs/DECISIONS.md`, `docs/KICKOFF_NOTES.md`.
> **Date**: 2026-07-19.

---

## 1. Roadmap overview

Per `KICKOFF_NOTES.md` §1, the product vision is deliberately open-ended ("what does it become 6
months to 1 year from now... make our app the only one") and monetization (§2) is explicitly an
open question — this roadmap does not invent a business model or pricing tier and treats both as
out of scope for MVP sequencing. What §4 *does* give us is an execution strategy this roadmap
follows directly: **ship a working MVP, collect real feedback, iterate** — which matches how the
build has actually proceeded so far (HEALTH_CHECK shipped first and has already been through six
demo-feedback rounds). The four MVPs below sequence the KB's three core business functions
(HEALTH_CHECK, TOURING_PLAN, MAP_TRACKING) plus the cross-cutting GLOBAL/HOME work around them,
in the order that best matches **user value delivered, technical/business dependency, and risk** —
not simply the KB's own listing order (§1: HEALTH_CHECK, TOURING_PLAN, MAP_TRACKING), except where
the project owner has directly instructed otherwise (see MVP2 below).

**Naming note**: the project owner has referred to "Module 2" when requesting this roadmap. Per the
task framing, that is treated as **TOURING_PLAN** — the KB's own #2 in §1's enumeration, and also
the function with the most unresolved open questions (OQ-T1–T4, all "not yet assumed" per KB §7).
This roadmap places TOURING_PLAN as **MVP2** on that instruction, not because a pure
value/dependency analysis would independently rank it there (see §4 and §6 below for the tension
this creates with MAP_TRACKING).

### Decisions needed from PO before the next MVP starts

Read this table first — it exists so the PO doesn't have to read all 8 sections to know what
needs a call. Everything below is detailed further at the section cited; none of it is decided yet.

| # | Decision | Detailed at | Current status |
|---|---|---|---|
| (a) | Where OQ-G1 (Gmail-only vs. shipped email/password) gets resolved | §6 | **Single recommended position: before MVP2 starts.** App Store review risk (Apple Sign-In may be required if any third-party sign-in is offered) is the deciding factor — see §6. |
| (b) | Confirm MVP2 (TOURING_PLAN) → MVP3 (MAP_TRACKING) order | §4 (top), §6 | Currently sequenced only because the PO named TOURING_PLAN "Module 2" — a pure dependency analysis (§4.2) would rank MAP_TRACKING first. Needs explicit PO reconfirmation **before MVP2 build starts**, not just before MVP3. |
| (c) | MVP2 scope cut | §4.3 | Provisional split (manual trip planning + pre-departure check only; routing/sharing deferred) — needs business-analyst/PO sign-off before build starts. |
| (d) | MAP_TRACKING tab placement (vs. the Lucky Draw placeholder) | §5, top of MVP3 | KI-9 — needs an explicit PO decision **before MVP3 starts**. This is a navigation/product call, not something engineering can settle mid-build. |

---

## 2. Competitor feature backlog

Sourced from web research on maintenance-tracking apps (MotoVault, MotorManage, Drivvo, MotoLogger,
Rydful) and touring/route-planning apps (Rever, Calimoto, Kurviger). Legend:
- **Have** — already shipped or implemented in this repo.
- **Market-standard-missing** — competitors treat this as baseline; we don't have it yet.
- **Differentiator-later** — beyond market baseline; candidate for a later MVP, not core value.

### HEALTH_CHECK

| Feature | Have | Market-standard-missing | Differentiator-later |
|---|---|---|---|
| Distance/time/event-count interval tracking, 4-state wear model | ✅ (`D-STATUS-BOUNDARIES`) | | |
| Mark-as-replaced + undo | ✅ (KB §2.3, `D-DEMO1`) | | |
| Per-part spend tracking + running total, spend-this-year summary | ✅ (`D-HEALTH-MVP-SCOPE`) | | |
| Motorcycle-specific maintenance items (chain, tires, brake pads, valve adj., seasonal storage) | Partial — 13-item generic list shipped (`D-OQ-H7-METRIC-LIST`), **not stakeholder-confirmed** | Full confirmed metric list (OQ-H7) | Valve-adjustment / seasonal-storage-specific items (none of our competitors' full depth is in scope yet) |
| Brand/model database driving manufacturer intervals (MotorManage: 600+ brands / 45,000+ models) | Partial — 4-row curated seed catalog, generic-default fallback (`D-OQ-H4-BRAND-COVERAGE`); **selection doesn't yet affect intervals (KI-16)** | Real interval-override wiring (KI-16); broader brand/model coverage (OQ-H4) | Full catalog parity with MotorManage-scale coverage |
| AI-predicted service due-date from riding pattern/mileage rate | — | | ✅ candidate — matches `KICKOFF_NOTES.md` §4's "fake it" AI approach |
| Full cost picture: fuel, insurance, registration, parking, receipt photo capture, tax-deduction export (Drivvo) | — (spend entries tied only to service items) | Fuel/insurance/registration cost tracking | Receipt photo capture, tax-deduction export |
| Multi-vehicle / shared-household tracking (Drivvo) | — (schema is vehicle-scoped and ready; UI is single-bike, `D-OQ-G2-MULTI-VEHICLE`) | Multi-vehicle UI (OQ-G2) | Shared/household multi-user access to one vehicle |
| Offline-first with sync (MotorManage) | — | Worth flagging as a non-functional consideration; not yet assessed | |

### TOURING_PLAN

| Feature | Have | Market-standard-missing | Differentiator-later |
|---|---|---|---|
| Multi-day trip planning with checkpoints/stops (KB §3.1 core goal) | — (stub screen only, "Feature coming soon") | Baseline manual trip creation + pinned stops | |
| Pre-departure maintenance check tied to HEALTH_CHECK status | — | Baseline integration once OQ-T1/T2 resolved | |
| Manual pin-dropping vs. automatic route suggestion | — | Manual pin-dropping (low-risk baseline) | Auto route suggestion by twistiness/elevation/scenery (Rever), AI-generated loop/point-to-point routes from curviness+duration+direction inputs (Calimoto), mathematically adjustable curviness "fun factor" (Kurviger) — all OQ-T3 |
| Shared route library / community | — | | Rever's large shared-route library + active community — OQ-T4-adjacent, large scope |
| Shareable trip plans with a group of riders | — | | OQ-T4 |
| Turn-by-turn navigation | — | Common competitor baseline once routing exists | |

### MAP_TRACKING

| Feature | Have | Market-standard-missing | Differentiator-later |
|---|---|---|---|
| Live GPS ride recording + route redraw on map (KB §4.1) | Partial — code exists in `src/features/map-tracking/`, **no tab currently points to it (KI-9)** | Confirm functional completeness + wire navigation | |
| Background recording (app not open) | — | OQ-M1, not yet assumed | |
| Trip history (past trips, not just current) | — | OQ-M2, not yet assumed | |
| GPS-gap handling affecting odometer accuracy | — | OQ-M3, not yet assumed | |
| Lean-angle data capture during recording (Calimoto) | — | | Differentiator, no competitor-parity urgency |
| Route recording feeding a shared community library (Rever) | — | | Depends on TOURING_PLAN's route-library feature existing too |

**Sources** (as supplied by the orchestrator's live web-search pass; URLs not independently
re-verified by this agent in this session — flag to business-analyst if citation-grade sourcing is
needed for a stakeholder-facing doc):
- Rever — rever.co
- Calimoto — calimoto.com
- Kurviger — kurviger.de
- Drivvo — drivvo.com
- MotoVault, MotorManage, MotoLogger, Rydful — named by the orchestrator's research pass; exact
  product URLs not captured in this pass, recommend re-confirming before citing externally.

---

## 3. MVP1 — HEALTH_CHECK (in progress, mostly built)

**Status**: build already started and largely complete — implemented and **passing all gates** as
of 2026-07-17 (`KNOWN_ISSUES.md` header), through six demo-feedback rounds (`D-DEMO1`–`D-DEMO6`).
This is not a "propose scope" MVP — it's a "close it out" MVP.

**Shipped**: Live Vitals, Service Reminders (4-state colored meter, mark-as-replaced + undo,
per-part price + running total), Spent-this-year summary + itemized spend details, first-launch
onboarding (language, bike info, recently-changed checklist), EN/VI i18n app-wide, brand/name
cascading dropdowns (curated seed catalog + free-text "Other"), persistent edit-vehicle entry
point, editable interval/last-service/price in part detail sheet.

### Single real blocker: KI-16

Selecting a catalog bike (e.g. "Kawasaki Versys 650") sets brand/name only — it does **not** wire
that bike's interval overrides into the service items shown. The brand-select feature is currently
non-functional beyond a label, not a copy/wording issue. **This is the one item that must close
before MVP1 can be called done** — everything in the table below is a known limitation that can
ship in parallel with MVP2 work, not a blocker.

**Everything else remaining (non-blocking)**:

| Item | Type | Why it matters |
|---|---|---|
| KI-6 | Functional gap (narrow) | Undo of mark-as-replaced doesn't revert a price/spend entry recorded alongside the mark — partial undo. |
| KI-8 | Functional gap (narrow) | Manual "last service" odometer edits aren't covered by the undo mechanism. |
| KI-2, KI-3 | Copy/wording | Overdue-caption and non-km-axis remaining-value wording need business-analyst/designer confirmation. |
| KI-4 | Definition gap | "Today's distance" interpretation needs business-analyst confirmation. |
| KI-7 | Business-rule gap | Time-axis parts not marked "recently changed" start their clock at onboarding (asymmetric with km parts) — needs product-owner/business-analyst confirmation of intended baseline. |
| OQ-H4 (brand data) | **Recommendation pending stakeholder sign-off** | Which brands/models to research-verify, and by whom — content workstream, not engineering. |
| OQ-H7 (final metric list) | **Recommendation pending stakeholder sign-off** | Interim 13-item list is shipped and usable; not yet a confirmed business decision. |
| OQ-H6/OQ-H8 (notifications) | Deferred by design | No-push-in-MVP is `Decided`; channel + trigger policy is `Recommendation pending real stakeholder sign-off` (`D-OQ-H6-H8-NOTIFICATIONS`) — intentionally out of MVP1 scope, not a gap. |

**Recommendation**: close KI-16, then declare MVP1 done. None of the other items block
HEALTH_CHECK's core value ("what needs servicing, and how urgent is it" — `D-HEALTH-MVP-SCOPE`).

---

## 4. MVP2 — TOURING_PLAN ("Module 2")

> **⚠ Sequencing decision needs PO reconfirmation before MVP2 build starts** (decision (b) in the
> table at the top of this document). TOURING_PLAN is placed here **only** because the project
> owner named it "Module 2" — §4.2 and §6 show a pure dependency/value analysis would rank
> MAP_TRACKING (MVP3) first, since every competitor researched couples route planning to
> ride-recording data. This is not a settled order; do not start MVP2 build assuming it's final.

**Per the project owner's explicit framing, this is next in sequence.** Scope is **not
finalized** — the KB's own open questions for this function (OQ-T1–T4) are all still "not yet
assumed" (KB §7), and per this task's constraint, detailed feature specs/acceptance criteria are
business-analyst's job, not this roadmap's. What follows is the level this roadmap is allowed to
commit to: why it's next, what's blocking a real build plan, and a provisional MVP-cut candidate
list for business-analyst/designer to react to — not a finished backlog.

**Cannot start build until answered** — these gate whether there is a real implementation plan at
all, not just polish:
- Trip creation flow + its pre-departure integration with HEALTH_CHECK → blocked on OQ-T1, OQ-T2.
- Whether a routing engine is needed at all vs. manual pin-dropping only → blocked on OQ-T3.
- Whether any sharing/social backend is needed → blocked on OQ-T4.

### 4.1 Blocking business questions (business-analyst must resolve before build starts)

| ID | Question | Why it blocks build |
|---|---|---|
| OQ-T1 | Does the pre-departure HEALTH_CHECK warning act on `Overdue` only, or also `Replace`/`Due soon`? | Determines the trigger condition for the single confirmed integration point between TOURING_PLAN and HEALTH_CHECK (KB §3.2). |
| OQ-T2 | Is the warning blocking or non-blocking? | Changes the trip-creation flow's UX and error states materially. |
| OQ-T3 | Automatic route suggestion, or manual pin-dropping only? | This is the single biggest scope swing in this module — manual pin-dropping is a small, self-contained feature; auto-routing (per Rever/Calimoto/Kurviger, §2 above) is a large routing-engine effort with its own data/algorithm dependencies. |
| OQ-T4 | Should trip plans be shareable with a group of riders? | Determines whether TOURING_PLAN needs any social/sharing backend at all in this MVP. |

### 4.2 Dependency flag: MAP_TRACKING

Every touring/route-planning competitor researched (Rever, Calimoto, Kurviger) ties route
planning to a ride-recording capability — either recording feeds the route library, or planning and
recording are the same feature viewed from two angles. In this project's terms: **any TOURING_PLAN
feature that suggests routes from real riding data, or builds a shareable route library, depends on
MAP_TRACKING's recording capability existing first.** Manual pin-dropping and the pre-departure
HEALTH_CHECK warning do **not** have this dependency — they can be built standalone. This is the
central sequencing tension called out in §6 below.

### 4.3 Provisional MVP-vs-later cut (PROVISIONAL — candidate material only, not a decision)

| Candidate for MVP2 | Candidate for later (post-MAP_TRACKING or explicitly deferred) |
|---|---|
| Manual multi-day trip creation with pinned stops/checkpoints (KB §3.1's stated core goal) | Automatic route suggestion by twistiness/elevation/scenery (Rever-style) |
| Pre-departure HEALTH_CHECK warning, once OQ-T1/T2 are answered | AI-generated routes from curviness/duration/direction inputs (Calimoto-style) |
| — | Adjustable route "fun factor" / curviness ranking (Kurviger-style) |
| — | Shared route library / community features (Rever-style) — depends on OQ-T4 confirming shareability is even wanted |
| — | Shareable trip plans with a rider group (OQ-T4, if confirmed) |

This split follows the same logic already applied to HEALTH_CHECK's MVP cut
(`D-HEALTH-MVP-SCOPE`): ship the smallest slice that delivers KB §3.1's stated business goal (plan
a multi-day trip with stops) without pulling in a routing-engine-scale effort ahead of business
confirmation that it's even wanted (OQ-T3) or that data-dependency (MAP_TRACKING) has landed.

---

## 5. MVP3 and MVP4 (proposed — recommendation pending sign-off)

### MVP3 — MAP_TRACKING (+ cross-cutting reconciliation)

> **⚠ Cannot start until decided/answered:**
> - **MAP_TRACKING tab/navigation placement (KI-9) — a PO decision, not an engineering judgment
>   call to make mid-build** (decision (d) at the top of this document). New 4th tab? Merged into
>   Touring? Replaces the "Lucky Draw" placeholder once GPS tracking is real? The 3rd tab was
>   reassigned to Lucky Draw per a direct stakeholder instruction (`D-DEMO3`), so MVP3 cannot
>   silently reclaim it — it needs an explicit PO call before this MVP starts, not during.
> - OQ-M1 (background recording), OQ-M2 (trip history), OQ-M3 (GPS-gap handling — also affects
>   HEALTH_CHECK odometer accuracy, so it's not MAP_TRACKING-only risk).
> - **OQ-G1 is not this MVP's problem to solve.** Per the single position chosen in §6, it's
>   resolved **before MVP2**, so by the time MVP3 starts it should already be closed — it is listed
>   here only as a precondition check, not a task bundled into MVP3.

**Why third, not later**: MAP_TRACKING already has code (`src/features/map-tracking/`) sitting
unreachable in the UI (KI-9) — closer to done than TOURING_PLAN's stub. It unblocks two things
already shipped and waiting on it: HOME's "Last ride" caption (KI-13, shows "No rides recorded
yet" for every real user until this ships) and TOURING_PLAN's differentiator-later route-suggestion
features (§4.2 above). Sequencing MAP_TRACKING right after TOURING_PLAN's baseline (rather than
after MVP2's *entire* backlog) means TOURING_PLAN's later differentiators become buildable sooner,
not stuck behind an MVP4 that also has to absorb everything else.

**Scope candidates** (subject to business-analyst resolving OQ-M1–M3 first, same "don't invent
business rules" constraint as TOURING_PLAN):
- Wire MAP_TRACKING to a real tab, per the PO placement decision above.
- Resolve OQ-M1, OQ-M2, OQ-M3 per the callout above.

### MVP4 — Platform maturity & differentiators

Everything else that's real scope but not on the critical path of the three core KB functions:

| Item | Source | Notes |
|---|---|---|
| Multi-vehicle support (OQ-G2) | KB §5.5, `D-OQ-G2-MULTI-VEHICLE` | Schema already ready; UI deferred by design. Revisit once single-bike MVP usage data exists. |
| Full brand/model catalog research (OQ-H4) | KB §7, `D-OQ-H4-BRAND-COVERAGE` | Content workstream; competitor bar is MotorManage's 600+ brands — large effort, sequence based on real demand signal. |
| Notification channel + trigger policy build-out (OQ-H6/H8) | `D-OQ-H6-H8-NOTIFICATIONS` | Now sequenced after MAP_TRACKING/TOURING_PLAN exist — more real usage patterns to inform whether push is worth the infra cost. |
| HOME health-score formula/wording sign-off (KI-14) | `D-HOME-HEALTH-SCORE` | Currently a reasonable engineering default, not a confirmed business rule — cheap to confirm, low risk either way. |
| Lucky Draw — real gamification scope, or retirement | `D-DEMO3`, KI-9 | Currently a stakeholder-instructed placeholder occupying MAP_TRACKING's old tab slot. Once MAP_TRACKING gets a real nav destination in MVP3, product-owner needs to decide whether Lucky Draw becomes a real feature or is retired/relocated — not a KB business function, so it competes for priority on its own merits. |
| Full cost picture (fuel, insurance, registration, receipt capture, tax export) | Drivvo-pattern, §2 above | Market-standard-missing relative to Drivvo; not blocking HEALTH_CHECK's core value, appropriate for a later MVP. |
| TOURING_PLAN differentiators unlocked by MVP3 | §4.2, §4.3 above | Auto-route suggestion, shared route library, shareable trip plans — now buildable since MAP_TRACKING exists. |
| AI-predicted service due-dates | `KICKOFF_NOTES.md` §4 "fake it" AI approach | Explicit product-vision idea; appropriate once core data (real ride/service history) exists to predict from. |

---

## 6. Cross-MVP dependencies & sequencing risks

- **MAP_TRACKING ↔ TOURING_PLAN coupling**: every competitor researched couples route
  planning/suggestion to ride-recording data. This roadmap still sequences TOURING_PLAN (MVP2)
  ahead of MAP_TRACKING (MVP3) **only because the project owner explicitly named it "Module 2"** —
  a pure dependency/value analysis would put MAP_TRACKING first or pair the two. The mitigation is
  MVP2's provisional cut (§4.3): ship only the MAP_TRACKING-independent slice of TOURING_PLAN
  (manual planning + pre-departure check) in MVP2, and push every MAP_TRACKING-dependent
  TOURING_PLAN feature into MVP4. **This sequencing choice needs explicit product-owner
  confirmation before MVP2 build starts** (decision (b), top of document) — it resolves an
  instruction ("Module 2 next") against a value-analysis finding (routing features want
  MAP_TRACKING first) by narrowing MVP2's scope rather than silently reordering the project
  owner's instruction.
- **OQ-G1 auth conflict (KI-18): single resolved position is *before MVP2 starts*** (decision
  (a), top of document) — not bundled into MVP3, not deferred to MVP4. The shipped build is
  email/password; the documented business requirement is Gmail-only. The deciding factor is a
  real **App Store review implication**, flagged in both `GLOBAL_REQ.md` §1 and KB OQ-G1: Apple
  Sign-In may be *required* by App Store review if any third-party sign-in (Gmail) is offered.
  The longer this ships without reconciliation, the more UI/tests/docs accumulate against
  whichever path turns out wrong — which is why this sits ahead of MVP2, not alongside or after it.
- **OQ-H4 catalog-coverage question affects both MVP1 close-out and market competitiveness**: the
  fallback mechanism is decided and shipped (generic defaults + "using generic defaults" note); but
  the curated seed sample is only 4 rows against competitors offering hundreds of brands. This
  doesn't block MVP1 (generic defaults deliver the core value), but it's a real competitive gap
  worth a deliberate later-MVP decision on investment level, not an accidental permanent 4-row
  catalog.
- **Lucky Draw / MAP_TRACKING tab slot**: KI-9 flags that MAP_TRACKING currently has no nav entry
  point because the 3rd tab was reassigned to Lucky Draw per direct stakeholder instruction
  (`D-DEMO3`). This is a **product-owner decision, not an engineering judgment call** — MVP3
  cannot start reclaiming that slot without it (decision (d), top of document; also called out at
  the top of MVP3 in §5).

---

## 7. Open questions requiring real stakeholder input

Consolidated by MVP — none of these are re-decided here; see `docs/MOTO_APP_KNOWLEDGE_BASE_EN.md`
§7 and `docs/DECISIONS.md` for full detail and current working assumptions.

| MVP | Blocking / informing open questions |
|---|---|
| MVP1 close-out | OQ-H4 (brand data sourcing), OQ-H7 (final metric list) — both already `Recommendation pending real stakeholder sign-off` in `DECISIONS.md`; KI-2/3/4/7 need business-analyst confirmation of copy/definitions |
| MVP2 (TOURING_PLAN) | OQ-T1, OQ-T2, OQ-T3, OQ-T4 — all four block a real build plan, per §4.1 above |
| MVP3 (MAP_TRACKING) | OQ-M1 (background recording), OQ-M2 (trip history), OQ-M3 (GPS-gap handling — also affects HEALTH_CHECK odometer accuracy); nav placement decision (KI-9); OQ-G1 (auth reconciliation, urgent per §6) |
| MVP4 | OQ-G2 (multi-vehicle), OQ-H4 (full catalog investment level), OQ-H6/OQ-H8 (notification channel + trigger policy), KI-14 (health-score formula sign-off), Lucky Draw scope decision |
| Cross-cutting, unresolved by any MVP boundary | Monetization model (`KICKOFF_NOTES.md` §2 — subscription vs. one-time vs. third-party revenue, entirely open); OQ-G3 (default language behavior, low-risk, currently assumed "prompt at first launch") |

---

## 8. Document status

Version 1.0 — first draft of the 4-MVP roadmap, written from the KB/GLOBAL_REQ/HOME_REQ/
KNOWN_ISSUES/DECISIONS state as of 2026-07-19. Needs revisiting when: OQ-T1–T4 are answered (MVP2
scope finalizes), OQ-G1 is reconciled, or the project owner confirms/rejects the MVP2/MVP3
sequencing trade-off called out in §6.

Version 1.1 (2026-07-19) — clarification pass: added the "Decisions needed from PO" summary table
(§1), resolved the OQ-G1 placement contradiction between §5 and §6 into a single position (before
MVP2), added explicit "cannot start build until" callouts to the top of MVP2 and MVP3, split KI-16
out as MVP1's sole real blocker, and marked the MVP2-before-MVP3 sequencing as needing PO
reconfirmation before MVP2 build starts, not just noted in cross-dependencies. No section
numbering changed; §2/§3/§5/§7/§8 structure and all ratified `DECISIONS.md` citations are
unchanged.
