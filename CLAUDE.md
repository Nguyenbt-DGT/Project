# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Moto Companion App

Mobile app (iOS/Android) for motorcycle riders: a Home landing dashboard, maintenance tracking
(HEALTH_CHECK), trip planning (TOURING_PLAN), and route recording (MAP_TRACKING).

**Stack**: TypeScript (strict) · Expo SDK 54 (React Native, Expo Router — pinned, see
`docs/DECISIONS.md` `D-SDK54`) · Supabase (Postgres, Auth, Storage) · GitHub Actions (CI/CD).

## Required reading before implementing or testing anything

1. [docs/FRAMEWORK_RULES.md](docs/FRAMEWORK_RULES.md) — **binding technical rules** for
   implementation, testing, Supabase usage, and agent conduct. If your approach conflicts with a
   rule there, the rule wins; deviations must be declared explicitly (Rule 8.6).
2. [docs/moto-app-knowledge-base-en.md](docs/moto-app-knowledge-base-en.md) — business requirements
   (the "KB"). Its open questions are answered by the product-owner agent, never guessed (Rule 8.2).
3. [docs/GUIDELINE.md](docs/GUIDELINE.md) — setup & day-to-day workflow: how to run the app,
   test gates (/smoke-test, /regresstion-test), agent handoff pattern, common pitfalls.
4. [docs/KICKOFF_NOTES.md](docs/KICKOFF_NOTES.md) — vision and future ideas; NOT in MVP scope
   unless product-owner prioritizes them.
5. [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — every
   non-obvious implementation choice and every open limitation is logged here, not just in chat
   history. Check before re-deciding something or re-discovering a known gap.

Feature-specific requirements live in `docs/HEALTH_REQ.md`, `docs/HOME_REQ.md`, and
`docs/GLOBAL_REQ.md` (auth, onboarding, units, language) — read the one relevant to the feature
you're touching.

## Commands

```bash
# App
npx expo start --tunnel            # run the app (tunnel mode — required in this codespace, see Gotchas)
npx tsc --noEmit                   # typecheck
npx eslint .                       # lint
npx jest                           # all unit/component tests
npx jest path/to/file.test.ts      # a single Jest file
npx jest -t "name substring"       # tests matching a name

# Supabase (local — requires Docker)
npx supabase start                 # start the local stack
npx supabase migration new <name>  # create a migration
npx supabase db reset              # rebuild local DB from migrations + seed (also restarts containers)
npx supabase gen types typescript --local > src/types/database.types.ts   # after every migration
npm run test:db                    # all DB/RLS/RPC integration tests (vitest, against local stack)
npx vitest run --config vitest.config.ts tests/db/some-file.test.ts       # a single DB test file

# Slash commands (Claude Code)
/smoke-test         # fast gate: typecheck, lint, unit tests, app boot
/regresstion-test    # full gate: clean DB rebuild + all tests incl. RLS/RPC
```

## Architecture

**Feature modules** (`src/features/<name>/`) are the unit of ownership — `home`, `health-check`,
`touring-plan`, `map-tracking`. Each follows the same internal shape (Rule 1.1/1.2):

```
index.ts     Public API — the ONLY entry point for code outside the feature
screens/     Composed screens rendered by thin route files in /app
components/  Feature-local UI
api/         TanStack Query hooks — all Supabase/RPC calls (Rule 3.3, no manual useEffect fetching)
logic/       Pure TypeScript, no React/Supabase imports (Rule 1.3) — the unit-test target
i18n.ts      useT() — resolves this feature's labels against the app-wide language
types.ts     DB row -> view model mappers, where needed
```

Cross-feature imports must go through the target feature's `index.ts` barrel — **except** a pure
`logic/` module may be deep-imported directly (e.g.
`@/features/health-check/logic/status`) when re-exporting it through the barrel would force the
importer to transitively load screen-bearing code and its native deps (breaks under Jest — see
`D-HOME-DEEP-IMPORT`). `home` deep-imports several of `health-check`'s `logic/` modules this way
specifically so Home can never disagree with what the Health tab itself computes.

**Business invariants live in Postgres, not client code** (Rule 4.5). Multi-step writes that must
stay consistent (e.g. "mark service done" resets a baseline, conditionally bumps the coupled
oil-filter counter, and logs an undo snapshot, atomically) are single RPCs
(`supabase/migrations/*_health_rpcs.sql`, `*_feedback_undo_and_onboarding.sql`) —
`mark_service_done`, `undo_last_service`, `apply_trip_distance`, `set_odometer`,
`onboard_vehicle`. The client calls one RPC; it never orchestrates the steps itself. New tables need
**both** an RLS policy and an explicit `GRANT` to `authenticated` (Rule 4.2) — this Supabase CLI
version does not auto-expose new tables to PostgREST roles, so RLS alone silently leaves a table
unreachable (`42501`/permission-denied, not a policy rejection).

**Four-state wear model** (`health-check/logic/status.ts`): every tracked part is
`fresh | due_soon | replace | overdue` from `progress = (current − last_service) / interval`, with
boundaries `p ≤ 0.65` fresh, `≤ 0.90` due_soon, `≤ 1.00` replace, `> 1.00` overdue (a boundary value
belongs to the lower-severity state — `D-STATUS-BOUNDARIES`). Handles km/days/event-count axes
independently and reduces multi-axis items to the worst axis. This is the single source of truth
consumed by both the Health tab and Home's bike-health score/overdue-parts list.

**i18n**: `src/i18n.tsx` holds the `Language` type, `LanguageProvider`/`useLanguage()`, and the
shared `label()`/`resolveLabel()` utility. Each feature has its own `logic/labels.ts` (English +
Vietnamese `{key, fallback, vi}` triples) and `i18n.ts` exposing `useT()` — no inline hardcoded
UI strings anywhere.

**Env/secrets** (Rule 3.6): only `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` may be
referenced in app code, validated at the boundary by `src/lib/env.ts` (zod). The `service_role` key
never appears in the app. `src/lib/supabase.ts` is the single client instance — no other
`createClient` calls. Session storage is platform-split: `expo-secure-store` on native,
`localStorage` on web (secure-store has no web implementation).

**Path alias**: `@/*` resolves to `./src/*` (see `tsconfig.json`).

## Gotchas specific to this repo

- **Changing `.env` requires `npx expo start --tunnel --clear`, not a plain restart.** Metro caches
  transformed output per source file; if the file referencing `process.env.EXPO_PUBLIC_*` didn't
  change, a bare dev-server restart reuses the old inlined value even though the process is new.
- **If Supabase REST/RPC calls fail while Auth calls still work, check `docker ps -a` for an exited
  `supabase_rest_*` container** — `supabase db reset` restarts containers and it can fail to come
  back up, leaving Kong unable to route any `/rest/v1/*` call while the (separate) Auth container
  keeps working fine. `docker start supabase_rest_<project>` fixes it.
- SDK is **pinned to 54** — target devices can't run newer SDKs (`D-SDK54`). `npx expo install`
  can silently bump it; after any dependency change, `git diff package.json` for unintended
  expo/react-native/typescript churn.
