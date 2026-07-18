# Moto Companion App 🏍️

A mobile app (iOS/Android) for motorcycle riders — track your bike's health, plan touring trips,
and record the routes you ride.

## What it does

| Function | Description |
|---|---|
| **HEALTH_CHECK** | Track the vehicle's technical condition (odometer, engine oil, coolant, and user-defined metrics) against maintenance intervals, and see each part's wear as a four-state status (`fresh` → `due_soon` → `replace` → `overdue`) computed from percentage-of-interval. Also tracks per-part spend for the year. **MVP implemented & tested** — see below. |
| **TOURING_PLAN** | Plan touring trips (potentially multi-day) with stops/checkpoints. Before departure, the app checks the selected vehicle's maintenance status and warns if service is overdue. |
| **MAP_TRACKING** | Record trips in real time while riding and redraw the traveled route on a map. Recorded distance feeds the vehicle's total km, which drives maintenance checks. |

How the functions connect:

```
Ride (MAP_TRACKING) → distance added to vehicle total km → HEALTH_CHECK re-evaluates
metrics vs thresholds → notification if service is due

New TOURING_PLAN → HEALTH_CHECK status of the chosen vehicle → pre-departure warning if overdue
```

## Tech stack

- **TypeScript** (strict) — everywhere
- **Expo** (React Native + Expo Router) — the mobile app
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions
- **Render** — custom backend services / cron jobs (only when Supabase-native isn't enough)

## Repository layout

```
app/          Expo Router routes (thin — render features)
src/          Feature modules (health-check, touring-plan, map-tracking), lib, components, hooks, types
supabase/     Migrations (schema source of truth), Edge Functions, seed data
tests/db/     Vitest DB/RLS/RPC integration tests (run against the local Supabase stack)
docs/         Project documentation (see below)
design/       HTML design references (mockup + prototype)
.claude/      AI agent definitions and slash commands
```

## Documentation map

| Document | Purpose |
|---|---|
| [docs/moto-app-knowledge-base-en.md](docs/moto-app-knowledge-base-en.md) | **Business requirements** (the "KB") — what to build |
| [docs/FRAMEWORK_RULES.md](docs/FRAMEWORK_RULES.md) | **Binding technical rules** — how to build & test it |
| [docs/GUIDELINE.md](docs/GUIDELINE.md) | Developer & AI-agent workflow guide — setup, day-to-day flow |
| [docs/HEALTH_REQ.md](docs/HEALTH_REQ.md) | HEALTH_CHECK feature requirements (the Health tab) |
| [docs/GLOBAL_REQ.md](docs/GLOBAL_REQ.md) | Global requirements — auth, onboarding, units, language |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical/product decision log (scope, resolved open questions) |
| [docs/HEALTH_ACCEPTANCE.md](docs/HEALTH_ACCEPTANCE.md) | Given/When/Then acceptance criteria for the Health MVP |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Known limitations & follow-ups |
| [docs/KICKOFF_NOTES.md](docs/KICKOFF_NOTES.md) | Product vision & future ideas (not MVP scope) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the local Supabase stack (requires Docker)
npx supabase start

# 3. Configure env — copy the example and fill in the values printed by `supabase start`
cp .env.example .env

# 4. Run the app
npx expo start
```

Then reset the local DB from migrations + seed and run the tests:

```bash
npm run db:reset     # apply migrations + seed
npm test             # Jest unit tests (pure business logic)
npm run test:db      # Vitest DB/RLS/RPC tests against the local stack
```

**CI/CD runs on GitHub Actions** ([.github/workflows/](.github/workflows/)) — `ci.yml` runs these
same gates on every push/PR; `deploy.yml` handles deploys from `main` (inert until enabled).

See [docs/GUIDELINE.md](docs/GUIDELINE.md) for the full workflow, testing, and the available
Claude Code slash commands (`/run-app-local`, `/smoke-test`, `/regresstion-test`).

## Status

**HEALTH_CHECK (Health tab): implemented, tested, and iterated through three rounds of demo
feedback.** Live Vitals, Service Reminders (four-state wear meters, translated part names,
mark-as-replaced with confirm/undo, editable odometer and per-part last-service checkpoint), a
Spent-this-year summary with drill-down, a persistent vehicle-edit entry point, first-login
onboarding, a location-permission notice, and full English/Vietnamese switching are all built on a
Supabase schema with RLS and business-invariant RPCs. Verified green: `tsc`, `eslint`, 83 Jest unit
tests, and 38 Vitest DB/RLS/RPC tests against the local stack. Deferred within Health:
brand→bike→model selection UI, full spend history beyond the current year, push notifications,
multi-vehicle UI (see [docs/DECISIONS.md](docs/DECISIONS.md) `D-HEALTH-MVP-SCOPE`), plus known
limitations in [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

The app currently ships 3 tabs: **Health** (above), **Touring** and **Lucky Draw** (both
"Feature coming soon" placeholders). **TOURING_PLAN** and **MAP_TRACKING** are KB-defined features
not yet built — MAP_TRACKING currently has no tab pointing to its module (see `KNOWN_ISSUES` KI-9).
Monetization, AI touring routes, and vehicle auto-detection (see kickoff notes) come later.

**Hosting**: the app runs against a local Supabase stack + Expo Go tunnel today. Moving to a hosted
Supabase project and an installable EAS build (no dev server needed) is documented step-by-step in
[docs/GUIDELINE.md](docs/GUIDELINE.md) §8, pending the account setup that only the project owner
can do.
