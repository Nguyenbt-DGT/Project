# Moto Companion App 🏍️

A mobile app (iOS/Android) for motorcycle riders — track your bike's health, plan touring trips,
and record the routes you ride.

## What it does

| Function | Description |
|---|---|
| **HEALTH_CHECK** | Track the vehicle's technical condition (odometer, engine oil, coolant, and user-defined metrics), configure maintenance intervals & warning thresholds, and get notified when service is due (`ok` → `warning` → `overdue`). |
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
src/          Components, feature modules (health-check, touring-plan, map-tracking), lib, hooks, types
supabase/     Migrations (schema source of truth), Edge Functions, seed data
docs/         Project documentation (see below)
mockup/       HTML design references
prototype/    Design prototypes
.claude/      AI agent definitions and slash commands
```

## Documentation map

| Document | Purpose |
|---|---|
| [docs/moto-app-knowledge-base-en.md](docs/moto-app-knowledge-base-en.md) | **Business requirements** (the "KB") — what to build |
| [docs/FRAMEWORK_RULES.md](docs/FRAMEWORK_RULES.md) | **Binding technical rules** — how to build & test it |
| [docs/GUIDELINE.md](docs/GUIDELINE.md) | Developer & AI-agent workflow guide — setup, day-to-day flow |
| [docs/KICKOFF_NOTES.md](docs/KICKOFF_NOTES.md) | Product vision & future ideas (not MVP scope) |
| `docs/DECISIONS.md` | Technical/product decision log (created on first decision) |

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

See [docs/GUIDELINE.md](docs/GUIDELINE.md) for the full workflow, testing, and the available
Claude Code slash commands (`/run-app-local`, `/smoke-test`, `/regresstion-test`).

## Status

Pre-MVP. The three core functions are being built first; monetization, AI touring routes, and
vehicle auto-detection (see kickoff notes) come later.
