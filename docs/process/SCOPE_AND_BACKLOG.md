# Scope & Backlog — Moto Companion App

> **Owner**: `product-owner` agent. **Referenced by**: `product-owner.md` agent instructions as
> the single place other agents check instead of re-deriving MVP scope from conversation history.
> Deferred *scope decisions* with rationale still get logged in [DECISIONS.md](../DECISIONS.md); this
> file is the current-state summary, not the reasoning trail.

## In v1 scope

**HOME** (landing tab) — implemented & tested:
- Vehicle hero card: tap for details, tap photo to upload from device (Supabase Storage)
- Merged distance/bike-health summary card, navigates into Health

**HEALTH_CHECK** (Health tab) — implemented & tested, per [D-HEALTH-MVP-SCOPE](../DECISIONS.md):
- Live Vitals — current odometer + today's distance (read-only)
- Service Reminders — four-state wear meter (fresh/due_soon/replace/overdue) per part, translated
  part names, tap-through detail view, manual odometer edit, mark-as-replaced with confirm/undo,
  direct editors for interval/last-service/price
- Spend-this-year summary (total + top-3 costliest items) with drill-down, shown in USD or VND
  depending on app language
- First-login onboarding (language, bike name/brand, mileage + unit, recently-changed checklist)
- Persistent vehicle-edit entry point, location-permission notice, full English/Vietnamese switching

Verified green: `tsc`, `eslint`, 99 Jest unit tests, 38 Vitest DB/RLS/RPC tests. Iterated through
four rounds of demo feedback.

## Explicitly out of scope (this round)

- **TOURING_PLAN** — not yet built. Its tab exists but shows "Feature coming soon."
- **MAP_TRACKING** — not yet built, and currently has **no tab** pointing to it (a placeholder
  "Lucky Draw" tab occupies its slot — see [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) `KI-9`).
- Within Health, deferred per [D-HEALTH-MVP-SCOPE](../DECISIONS.md):
  - Brand → bike → model dropdown selection UI and the full brand-data research behind it (generic
    defaults + a small curated seed sample ship instead)
  - Full Spend-details page (multi-year itemized history) — only the on-tab total + top-3 ships
  - Push notifications for due/overdue items — blocked on OQ-H6 (channel) and OQ-H8 (trigger states)
  - Multi-vehicle UI — one bike per user for MVP
  - Full i18n content — framework (`useT()`) exists but Vietnamese content coverage is still growing

## Backlog (later)

_(none recorded yet — see [KICKOFF_NOTES.md](../KICKOFF_NOTES.md) for un-prioritized future ideas:
monetization, AI touring routes, vehicle auto-detection)_
