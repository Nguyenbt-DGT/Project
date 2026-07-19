# Moto Companion App 🏍️

A mobile app (iOS/Android) for motorcycle riders — track your bike's health, plan touring trips,
and record the routes you ride.

## What it does

| Function | Description |
|---|---|
| **HOME** | The screen shown right after login/onboarding (leftmost tab). A tappable vehicle hero card (photo upload, last-ride caption) and a merged distance/bike-health summary that jumps into the Health tab. **Implemented & tested** — see below. |
| **HEALTH_CHECK** | Track the vehicle's technical condition (odometer, engine oil, coolant, and user-defined metrics) against maintenance intervals, and see each part's wear as a four-state status (`fresh` → `due_soon` → `replace` → `overdue`) computed from percentage-of-interval. Interval, last-service, and price are all directly editable per part. Also tracks per-part spend for the year, in either USD or VND depending on the app's language. **Implemented & tested** — see below. |
| **TOURING_PLAN** | Plan touring trips (potentially multi-day) with stops/checkpoints. Before departure, the app checks the selected vehicle's maintenance status and warns if service is overdue. **Not yet built** — its tab currently shows "Feature coming soon." |
| **MAP_TRACKING** | Record trips in real time while riding and redraw the traveled route on a map. Recorded distance feeds the vehicle's total km, which drives maintenance checks. **Not yet built** — currently has no tab pointing to it (a placeholder "Lucky Draw" tab took its slot; see [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) KI-9). |

How the functions connect:

```
Ride (MAP_TRACKING) → distance added to vehicle total km → HEALTH_CHECK re-evaluates
metrics vs thresholds → notification if service is due

New TOURING_PLAN → HEALTH_CHECK status of the chosen vehicle → pre-departure warning if overdue

HOME → reads the same vehicle/odometer/health data HEALTH_CHECK owns → tapping it opens Health
```

## Tech stack

- **TypeScript** (strict) — everywhere
- **Expo SDK 54** (React Native + Expo Router) — the mobile app; **pinned to 54**, do not upgrade
  (target devices can't run newer SDKs — see `docs/DECISIONS.md` `D-SDK54`)
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions
- **GitHub Actions** — CI/CD (typecheck/lint/tests on every push; deploy from `main`) — see
  [.github/workflows/](.github/workflows/)
- **Render** *(optional, not currently used)* — reserved for a custom backend service only if one
  becomes necessary beyond what Supabase covers natively (`FRAMEWORK_RULES.md` Rule 0.2/5.1)

## Repository layout

```
app/          Expo Router routes (thin — render features)
src/          Feature modules (home, health-check, touring-plan, map-tracking), lib, components, hooks, types
supabase/     Migrations (schema source of truth), Storage buckets, Edge Functions, seed data
tests/db/     Vitest DB/RLS/RPC integration tests (run against the local Supabase stack)
docs/         Project documentation (see below)
design/       HTML design references (mockup + prototype) and reference images
.claude/      AI agent definitions and slash commands
.github/      CI/CD workflows (GitHub Actions)
```

## Documentation map

| Document | Purpose |
|---|---|
| [docs/moto-app-knowledge-base-en.md](docs/moto-app-knowledge-base-en.md) | **Business requirements** (the "KB") — what to build |
| [docs/FRAMEWORK_RULES.md](docs/FRAMEWORK_RULES.md) | **Binding technical rules** — how to build & test it |
| [docs/GUIDELINE.md](docs/GUIDELINE.md) | Developer & AI-agent workflow guide — setup, day-to-day flow, hosted-deployment tutorial |
| [docs/HEALTH_REQ.md](docs/HEALTH_REQ.md) | HEALTH_CHECK feature requirements (the Health tab) |
| [docs/HOME_REQ.md](docs/HOME_REQ.md) | HOME feature requirements (the landing tab) |
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
npm run test:db      # Vitest DB/RLS/RPC tests against the local stack (needs Node 22+)
```

**CI/CD runs on GitHub Actions** ([.github/workflows/](.github/workflows/)) — `ci.yml` runs these
same gates on every push/PR (Node 22+, required by `@supabase/supabase-js`'s realtime client);
`deploy.yml` handles deploys from `main` (inert until enabled).

See [docs/GUIDELINE.md](docs/GUIDELINE.md) for the full workflow, testing, the hosted-deployment /
iOS-access tutorial, and the available Claude Code slash commands (`/run-app-local`, `/smoke-test`,
`/regresstion-test`).

## Status

**HOME (landing tab) and HEALTH_CHECK (Health tab): implemented, tested, and iterated through four
rounds of demo feedback.**

- **Home**: a vehicle hero card (tap to view details; tap the photo to upload one from the phone,
  stored in Supabase Storage) plus a merged distance/bike-health summary card that navigates to
  Health. Shown immediately after login/onboarding.
- **Health**: Live Vitals, Service Reminders (four-state wear meters with translated part names,
  mark-as-replaced with confirm/undo, and direct editors for interval, last-service, and price), a
  Spent-this-year summary with drill-down (amounts shown in USD or VND depending on the app's
  language), a persistent vehicle-edit entry point, first-login onboarding, a location-permission
  notice, and full English/Vietnamese switching throughout.

Both are built on a Supabase schema with RLS and business-invariant RPCs. Verified green: `tsc`,
`eslint`, 99 Jest unit tests, and 38 Vitest DB/RLS/RPC tests against the local stack. Deferred
within Health: brand→bike→model selection UI, full spend history beyond the current year, push
notifications, multi-vehicle UI (see [docs/DECISIONS.md](docs/DECISIONS.md) `D-HEALTH-MVP-SCOPE`),
plus known limitations in [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) (notably: the VND
conversion rate is an illustrative placeholder, not a live FX rate).

The app ships 4 tabs: **Home**, **Health** (both above), **Touring** and **Lucky Draw** (both
"Feature coming soon" placeholders). **TOURING_PLAN** and **MAP_TRACKING** are KB-defined features
not yet built — MAP_TRACKING currently has no tab pointing to its module (see `KNOWN_ISSUES` KI-9).
Monetization, AI touring routes, and vehicle auto-detection (see kickoff notes) come later.

**Hosting**: the app runs against a local Supabase stack + Expo Go tunnel today. Moving to a hosted
Supabase project and an installable EAS build (no dev server needed) is documented step-by-step in
[docs/GUIDELINE.md](docs/GUIDELINE.md) §8, pending the account setup that only the project owner
can do.
