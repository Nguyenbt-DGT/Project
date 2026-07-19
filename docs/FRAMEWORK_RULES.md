# FRAMEWORK RULES — Moto Companion App

> **Audience**: AI Agents (business-analyst, designer, product-owner, frontend-developer, and any
> implementation/testing agent) working on this repository.
> **Purpose**: This is the single source of truth for HOW to implement and test the application.
> Every agent MUST read this file before writing or modifying code. If a rule here conflicts with an
> agent's own habits or generic best practices, **this file wins**.
>
> Business requirements live in [moto-app-knowledge-base-en.md](moto-app-knowledge-base-en.md) (the "KB").
> This file covers the technical rules only. The KB defines WHAT to build; this file defines HOW.

---

## 0. THE STACK (fixed — do not substitute)

| Layer | Technology | Notes |
|---|---|---|
| Language | **TypeScript** (strict mode) | Everywhere: app, backend, scripts, tests |
| Mobile app | **Expo SDK 54** (React Native 0.81, Expo Router) | iOS + Android from one codebase. SDK **pinned** — see Rule 0.3 |
| Backend & DB | **Supabase** | Postgres, Auth, Realtime, Storage, Edge Functions |
| CI/CD | **GitHub Actions** | `.github/workflows/` — typecheck/lint/tests on every push, deploy from `main`. See Rule 5.5/7.4 |
| Server hosting *(optional, not currently used)* | **Render** | Only if a custom Node/API service becomes necessary beyond what Supabase covers natively — see Rule 0.2/5.1 |

**Rule 0.1** — Do NOT introduce alternative frameworks (e.g., Firebase, Prisma+own Postgres, bare
React Native CLI, AWS Lambda) without an explicit decision from the product-owner recorded in
`docs/DECISIONS.md`.

**Rule 0.2** — Prefer Supabase-native capabilities (RLS, Postgres functions, Edge Functions,
Realtime) before adding a custom Render service. A Render service is justified only for:
long-running jobs, heavy scheduled processing, third-party integrations needing a stable server, or
anything exceeding Edge Function limits (execution time, memory).

**Rule 0.3** — **Pin Expo SDK 54. Do NOT upgrade to a newer SDK (57+).** Target devices require
SDK 54, so the whole toolchain is pinned to it: `expo@~54`, `react-native@0.81.5`, `react@19.1.0`,
`typescript@~5.9`, `eslint-config-expo@~10`, `jest-expo@~54`, and the SDK-54 versions of every
`expo-*` module. `npx expo install <pkg>` (and `--fix`) can silently move the SDK version — after
any dependency change, `git diff package.json` and revert unintended expo/react-native/typescript
churn (`rm -rf node_modules package-lock.json && npm install`). Prefer already-installed SDK-54
Expo modules over adding new native deps (e.g. language persistence uses `expo-secure-store`, not
`@react-native-async-storage/async-storage`).

---

## 1. REPOSITORY LAYOUT

```
/app                    # Expo app (Expo Router file-based routes)
  /(tabs)/              # Main tab navigation: home, health-check, touring-plan, lucky-draw
  /(auth)/              # Sign-in / sign-up screens
/src
  /components/          # Reusable UI components (dumb/presentational)
  /theme.ts             # Shared app palette ("Night Garage")
  /i18n.tsx             # Shared Language context + label-resolution utility
  /features/            # Feature modules — one folder per business function
    /home/
    /health-check/
    /touring-plan/
    /map-tracking/
  /lib/                 # Supabase client, config, shared utilities
  /hooks/               # Shared React hooks
  /types/               # Shared TS types + generated Supabase types
/supabase
  /migrations/          # SQL migrations (source of truth for schema)
  /functions/           # Edge Functions (Deno/TS)
  /seed.sql             # Local dev seed data
/server                 # Render-hosted services (only if/when needed — currently unused)
/docs                   # KB, this file, decisions, design docs
/design                 # Design references — mockups, prototypes, reference images (read-only)
/.github/workflows      # CI/CD (GitHub Actions)
```

**Rule 1.1** — Feature code lives in `src/features/<feature>/`. Each feature folder owns its
screens' logic, hooks, API calls, and feature-specific components. Route files in `/app` stay thin —
they import from features and render.

**Rule 1.2** — Cross-feature imports go through each feature's `index.ts` (its public API). Never
deep-import another feature's internals — **except** a pure, side-effect-free `logic/` module
(Rule 1.3) may be deep-imported directly (e.g. `@/features/health-check/logic/status`) when
re-exporting it from `index.ts` would force consumers to also transitively load that feature's
screens/components (and their native dependencies) just to reach dependency-free functions. This
carve-out exists because barrel-file imports evaluate the entire module top-to-bottom regardless of
which named export is used — a pure-logic-only consumer otherwise breaks in any environment (Jest,
etc.) where the unrelated screen's native deps (e.g. `expo-font` via `@expo/vector-icons`) can't
resolve. See D-HOME-DEEP-IMPORT for the incident that surfaced this.

**Rule 1.3** — Business logic (e.g., maintenance status computation) must be written as **pure
TypeScript functions** in the feature folder, independent of React and Supabase, so it is unit-testable.

---

## 2. TYPESCRIPT RULES

**Rule 2.1** — `strict: true` in `tsconfig.json`. Never disable it. `noUncheckedIndexedAccess: true`
is also required.

**Rule 2.2** — `any` is forbidden. Use `unknown` + narrowing when a type is genuinely unknown.
`as` casts require a comment explaining the invariant that makes them safe. `@ts-ignore` /
`@ts-expect-error` are forbidden outside tests.

**Rule 2.3** — Database types are **generated, never hand-written**:

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

Regenerate after every migration. Hand-editing `database.types.ts` is forbidden.

**Rule 2.4** — Model domain states as discriminated unions, not boolean flags. Example — the KB's
canonical four-state maintenance status (KB §2.3, percentage-of-interval model):

```ts
type MetricStatus = 'fresh' | 'due_soon' | 'replace' | 'overdue';
```

These are the exact literals the whole codebase uses; boundary semantics are fixed by
`D-STATUS-BOUNDARIES` in [DECISIONS.md](DECISIONS.md).

**Rule 2.5** — Validate all external input (API payloads, deep links, Supabase function bodies) with
**zod** at the boundary. Internal code trusts the parsed types.

**Rule 2.6** — Naming: `camelCase` for variables/functions, `PascalCase` for types/components,
`SCREAMING_SNAKE_CASE` for constants, `kebab-case` for file names (`use-metric-status.ts`),
`snake_case` only for SQL/database identifiers.

---

## 3. EXPO / MOBILE RULES

**Rule 3.1** — Use **Expo Router** (file-based routing). Navigation structure mirrors the three
business functions: `health-check`, `touring-plan`, `map-tracking` as tabs.

**Rule 3.2** — Stay inside the **Expo managed workflow**. Prefer Expo SDK modules
(`expo-location`, `expo-notifications`, `expo-task-manager`, `expo-secure-store`) over bare RN
libraries. If a native module forces a dev-client/prebuild, record the decision in `docs/DECISIONS.md` first.

**Rule 3.3** — State management:
- **Server state** (anything from Supabase): TanStack Query (`@tanstack/react-query`). No manual
  `useEffect` + `useState` fetching.
- **Local/UI state**: React state or Zustand for cross-screen client state (e.g., an active trip
  recording session).
- Never duplicate server data into a client store "for convenience."

**Rule 3.4** — GPS & background tracking (MAP_TRACKING):
- Use `expo-location` + `expo-task-manager` for background recording (KB §4.3 open question — until
  the product-owner confirms, build foreground-first with the background task behind a feature flag).
- Buffer trackpoints locally and batch-write to Supabase (e.g., every 30–60s or N points). Never one
  insert per GPS point.
- Handle permission denial gracefully — every location feature must render a usable "permission
  needed" state.

**Rule 3.5** — Notifications (HEALTH_CHECK reminders): use `expo-notifications`. Threshold
evaluation that must fire while the app is closed runs server-side (Supabase scheduled Edge Function
or Render cron) and sends push via Expo Push API — never rely on the app being open to schedule
critical reminders.

**Rule 3.6** — Secrets: only `EXPO_PUBLIC_`-prefixed variables may be referenced in app code, and
only the Supabase URL + anon key qualify. The Supabase `service_role` key must NEVER appear in the
app bundle, in `app.json`, or in any `EXPO_PUBLIC_` variable — server-side only (Edge Functions /
Render env vars).

**Rule 3.7** — Every screen must handle its four states explicitly: loading, error (with retry),
empty, and populated. No blank screens on failure.

**Rule 3.8** — Offline awareness: riders lose signal on tours. Reads should serve cached data
(TanStack Query cache); trip recording must work fully offline and sync when connectivity returns.

---

## 4. SUPABASE RULES

**Rule 4.1** — **Migrations are the only way to change schema.** All schema lives in
`supabase/migrations/*.sql`, created with `npx supabase migration new <name>`. Never modify schema
via Studio in a shared environment; local Studio experiments must be captured with `supabase db diff`
into a migration before committing.

**Rule 4.2** — **RLS is mandatory on every table.** Enable Row Level Security in the same migration
that creates the table. Default posture: users can only read/write their own rows
(`auth.uid() = user_id`). A table without RLS is a release blocker. **RLS policies alone are not
sufficient in this project's Supabase CLI version** — new `public` tables are not auto-exposed to
`anon`/`authenticated`, so the same migration must also `GRANT` the appropriate privileges
(user-owned tables: SELECT/INSERT/UPDATE/DELETE to `authenticated`; shared reference tables: SELECT
to `authenticated` only). RLS restricts which rows; GRANT allows the role to touch the table at all
— you need both.

**Rule 4.3** — Auth: use Supabase Auth via `@supabase/supabase-js`. Session persistence in the app
uses `expo-secure-store` as the storage adapter. Never store tokens in AsyncStorage or hand-roll auth.

**Rule 4.4** — Single client instance in `src/lib/supabase.ts`; everything imports from there.
Direct `createClient` calls elsewhere are forbidden.

**Rule 4.5** — Derived business rules that must be consistent (e.g., "adding trip distance
increments the vehicle's single shared `current_odometer_km` exactly once and never touches
`last_service_km`" — KB §2.3) are enforced **in the database** (Postgres function/trigger or a
single RPC), not scattered across client code. The client calls one RPC (e.g.,
`apply_trip_distance(trip_id)`), it does not orchestrate multi-step writes.

**Rule 4.6** — Edge Functions (in `supabase/functions/`) handle: scheduled maintenance-threshold
checks, push notification dispatch, and any logic requiring `service_role`. Each function validates
its input with zod and returns typed JSON errors (`{ error: { code, message } }`).

**Rule 4.7** — Local development runs against `npx supabase start` (local stack), never against the
production project. `supabase/seed.sql` must contain enough data to exercise all three features
(a user, a vehicle, metrics in `fresh`/`due_soon`/`replace`/`overdue` states, one planned trip, one
recorded trip).

**Rule 4.8** — Environments: separate Supabase projects for `dev`/`staging` and `production`. Config
via env vars only — no hardcoded project URLs or keys in code.

---

## 5. RENDER RULES (custom backend services, when needed)

**Rule 5.1** — A `/server` service is added only per Rule 0.2, with the decision recorded in
`docs/DECISIONS.md`. Until then, this section is dormant.

**Rule 5.2** — Stack for Render services: Node.js LTS + TypeScript + Fastify (or Hono). Deployed
via `render.yaml` (Infrastructure as Code) committed at repo root — no manual dashboard-only config.

**Rule 5.3** — Render services talk to Supabase Postgres via `@supabase/supabase-js` with the
`service_role` key from Render environment variables (marked secret). They must respect the same
business invariants as Edge Functions (Rule 4.5 — call the RPCs, don't re-implement the logic).

**Rule 5.4** — Every Render service exposes `GET /healthz` returning `200` and its version. Use
Render Cron Jobs for scheduled work that outgrows Supabase scheduled functions.

**Rule 5.5** — **CI/CD is GitHub Actions, not Render auto-deploy** (`.github/workflows/`). CI
(`ci.yml`) runs the gates on every push/PR; CD (`deploy.yml`) deploys from `main` only (DB
migrations via `supabase db push`; the app via EAS). If a Render service exists (Rule 5.1) it is
deployed by the GitHub Actions pipeline, never a Render dashboard auto-deploy hook. Never deploy
from feature branches.

---

## 6. TESTING RULES

**Rule 6.1** — Test pyramid & tools:

| Level | Tool | What it covers |
|---|---|---|
| Unit | **Jest** (`jest-expo` preset) | Pure business logic — MUST cover status computation, remaining-km/days math, offline buffer logic |
| Component | **React Native Testing Library** | Screens & components: the four states of Rule 3.7, user interactions |
| API/DB | **Vitest + local Supabase** | RLS policies, RPCs, Edge Functions against `supabase start` |
| E2E | **Maestro** (post-MVP) | Critical flows: sign-in, log a service, record a trip, create a plan |

**Rule 6.2** — Business rules from the KB are the primary test targets. At minimum, the KB §2.3
status computation requires unit tests for ALL of (see `DECISIONS.md` `D-STATUS-BOUNDARIES`):
- the four status boundaries: `p ≤ 0.65` fresh, `0.65 < p ≤ 0.90` due_soon, `0.90 < p ≤ 1.00`
  replace, `p > 1.00` overdue (each boundary value belongs to the lower-severity state)
- km, time (days), and event-count axes, and dual-axis worst-of-two
- boundary values exactly at `0.65`, `0.90`, `1.00`, and just past `1.00`
- trip distance accumulation increments the shared odometer once and never mutates `last_service_km`

**Rule 6.3** — Every bug fix ships with a regression test that fails before the fix.

**Rule 6.4** — Definition of Done for any implementation task:
1. `npx tsc --noEmit` passes
2. `npx eslint .` passes (config: `eslint-config-expo` + `@typescript-eslint` strict; Prettier for formatting)
3. All tests pass; new logic has tests per Rule 6.1/6.2
4. New tables have RLS + a test proving another user cannot read/write the row
5. The feature was exercised end-to-end at least once in the Expo app (dev build/simulator)
6. KB open questions touched by the work are either answered (via product-owner) or explicitly
   flagged in the PR description — never silently guessed

**Rule 6.5** — Do not mock what you can run locally: test RLS and RPCs against the real local
Supabase stack, not against a mocked client. Mock only true externals (Expo Push API, third-party HTTP).

---

## 7. GIT & WORKFLOW RULES

**Rule 7.1** — Branches: `main` is protected and deployable. Work on `dev/<name>-<topic>` or
`feature/<topic>` branches; merge to `main` via PR.

**Rule 7.2** — Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`,
`chore:`), scoped to the feature when relevant — e.g., `feat(health-check): compute dual-axis metric status`.

**Rule 7.3** — A PR contains one logical change. Schema migration + the code using it may ship
together; unrelated refactors may not.

**Rule 7.4** — **CI/CD is GitHub Actions** (`.github/workflows/ci.yml` + `deploy.yml`). CI runs
typecheck, lint, unit tests, and the DB/RLS/RPC suite (plus a generated-types drift check) on every
push/PR; red CI blocks merge. CD deploys from `main` only and is inert until repo variable
`DEPLOY_ENABLED=true` and the deploy secrets are set (see `deploy.yml`). This replaces the earlier
Render-driven deploy flow.

---

## 8. RULES OF ENGAGEMENT FOR AI AGENTS

**Rule 8.1** — **Read before you write.** Before implementing, read: this file, the relevant KB
sections, and the existing code of the feature you're touching. Match existing patterns.

**Rule 8.2** — **The KB's open questions are not yours to answer.** If your task hits an unresolved
KB question (e.g., "is the pre-departure warning blocking?"), do not guess: escalate to the
product-owner agent, or implement the KB's stated current reading behind the smallest possible
seam and flag it. Record resolved answers in the KB (business-analyst updates it) and decisions in
`docs/DECISIONS.md`.

**Rule 8.3** — **Extensibility is a business requirement.** KB §2.2: maintenance metrics are
user-extensible. Never hardcode a fixed metric list in schema or code — metrics are rows, not enums.

**Rule 8.4** — Build for **multiple vehicles per user** at the schema level (vehicle is its own
table, everything hangs off `vehicle_id`) even while the UI supports one — this KB open question is
cheap to future-proof now and expensive later.

**Rule 8.5** — Do not implement monetization, ads, AI route drafting, or CarPlay integration
(KICKOFF_NOTES ideas) unless the product-owner has explicitly prioritized them. MVP = the three KB
functions.

**Rule 8.6** — When you deviate from any rule in this file, you must say so explicitly in your
output/PR with the reason. Silent deviations are treated as defects.

**Rule 8.7** — Update this file (via PR) when a new recurring technical decision is made — rules
that live only in chat history don't exist.

---

## 9. QUICK-REFERENCE COMMANDS

```bash
# App
npx expo start                     # run the app (dev)
npx tsc --noEmit                   # typecheck
npx eslint .                       # lint
npx jest                           # unit/component tests

# Supabase (local)
npx supabase start                 # start local stack
npx supabase migration new <name>  # create a migration
npx supabase db reset              # rebuild local DB from migrations + seed
npx supabase gen types typescript --local > src/types/database.types.ts
npx supabase functions serve       # run Edge Functions locally
```

---

## 10. DOCUMENT STATUS

- **Version**: 1.0 (2026-07-15)
- **Owner**: All agents; changes via PR per Rule 8.7.
- **Related**: [moto-app-knowledge-base-en.md](moto-app-knowledge-base-en.md) (business),
  [KICKOFF_NOTES.md](KICKOFF_NOTES.md) (vision/ideas), `docs/DECISIONS.md` (create on first decision).
