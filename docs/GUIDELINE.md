# GUIDELINE — Working on the Moto Companion App

> **What this is**: the practical "how do I get things done here" guide for developers and AI
> agents. It walks you through setup, the day-to-day workflow, and where everything lives.
> **What this is not**: the rulebook. Binding technical rules live in
> [FRAMEWORK_RULES.md](FRAMEWORK_RULES.md) — when this guide and a rule disagree, the rule wins.

---

## 1. Document map — read in this order

| # | Document | What it gives you |
|---|---|---|
| 1 | [README.md](../README.md) | Application overview: the three functions and how they connect |
| 2 | [moto-app-knowledge-base-en.md](moto-app-knowledge-base-en.md) | The "KB" — business requirements, rules, and OPEN questions |
| 3 | [FRAMEWORK_RULES.md](FRAMEWORK_RULES.md) | Binding technical rules (stack, structure, testing, conduct) |
| 4 | This file | Setup & workflow |
| 5 | [DECISIONS.md](DECISIONS.md) | Decision log — resolved open questions, MVP scope; check before changing direction |
| 6 | [HEALTH_REQ.md](HEALTH_REQ.md) · [GLOBAL_REQ.md](GLOBAL_REQ.md) | Feature & global requirements (Health tab; auth/onboarding/units/language) |
| 7 | [HEALTH_ACCEPTANCE.md](HEALTH_ACCEPTANCE.md) | Given/When/Then acceptance criteria the tests are written against |
| 8 | [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Known limitations & follow-ups |
| 9 | [KICKOFF_NOTES.md](KICKOFF_NOTES.md) | Vision/ideas — NOT in scope unless product-owner prioritizes |

---

## 2. First-time setup

Prerequisites: Node.js LTS, Docker (for local Supabase), and for device testing the Expo Go app
or a simulator.

```bash
npm install                 # 1. dependencies
npx supabase start          # 2. local Supabase stack (Docker; slow on first run)
cp .env.example .env        # 3. env — fill from the output of `npx supabase status`:
                            #    EXPO_PUBLIC_SUPABASE_URL      = API URL
                            #    EXPO_PUBLIC_SUPABASE_ANON_KEY = anon key
npx expo start --tunnel              # 4. run the app (scan QR with Expo Go, or press i / a / w)
```

Or simply run the slash command **`/run-app-local`** in Claude Code — it performs all of the
above with preflight checks and reports the URLs.

npm scripts you'll use constantly:

| Script | Does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the repo |
| `npm test` | Jest (unit + component) |
| `npm run test:db` | Vitest DB/RLS/RPC integration tests against the local Supabase stack (needs `db:reset` first) |
| `npm run db:reset` | Rebuild local DB from migrations + seed.sql |
| `npm run db:types` | Regenerate `src/types/database.types.ts` from the local schema |

---

## 3. Where code goes (orientation)

```
app/                  Routes ONLY — thin files that import a feature screen and render it
src/features/<f>/     Everything belonging to a business function:
                        index.ts   ← public API (only import point for outsiders, Rule 1.2)
                        screens/   ← screen components
                        components/ hooks/ api/
                        logic/     ← PURE business logic, no React/Supabase (Rule 1.3)
src/components/       Shared presentational components
src/lib/              supabase.ts (THE client, Rule 4.4) · env.ts (validated env)
src/hooks/            Shared hooks
src/types/            index.ts (shared domain types) · database.types.ts (GENERATED, Rule 2.3)
supabase/migrations/  Schema source of truth (Rule 4.1)
supabase/functions/   Edge Functions (scheduled checks, push dispatch, service_role logic)
supabase/seed.sql     Local dev data
```

Each feature folder has its own README with feature-specific rules.

---

## 4. Day-to-day workflow

1. **Branch** off `main`: `dev/<name>-<topic>` or `feature/<topic>` (Rule 7.1).
2. **Understand the task**: read the relevant KB section + feature README. If the task touches an
   OPEN KB question (they're checklisted in the KB), stop and escalate to the product-owner agent
   (Rule 8.2) — never guess business behavior.
3. **Schema first** if data changes: `npx supabase migration new <name>` → write SQL (with RLS in
   the same migration, Rule 4.2) → `npm run db:reset` → `npm run db:types` → commit migration +
   regenerated types together.
4. **Implement**: pure logic in `logic/` first (with unit tests), then hooks/api, then screens
   (handle all four states: loading / error / empty / populated, Rule 3.7).
5. **Verify while working**: **`/smoke-test`** — fast typecheck + lint + unit tests + boot check.
6. **Verify before PR**: **`/regresstion-test`** — full suite from a clean DB, including RLS/RPC
   tests and KB business-rule coverage. Also run through the feature once in the app yourself
   (Definition of Done, Rule 6.4).
7. **PR to `main`**: one logical change, Conventional Commit messages
   (`feat(health-check): ...`), declare any rule deviations explicitly (Rule 8.6).

### Slash commands (Claude Code)

| Command | When | What it does |
|---|---|---|
| `/run-app-local [ios\|android\|web]` | Start of a session | Boots local Supabase + Expo dev server, wires `.env`, reports URLs |
| `/smoke-test [feature]` | Before every commit | Fast PASS/FAIL: typecheck, lint, unit tests, boot check |
| `/regresstion-test [feature]` | Before every PR/merge | Full suite: clean DB rebuild, all tests, RLS audit, type-drift check, regression analysis |

### CI/CD

CI/CD is **GitHub Actions** (`.github/workflows/`), not Render (FRAMEWORK_RULES Rule 5.5/7.4).
`ci.yml` runs typecheck, lint, unit tests, and the DB/RLS/RPC suite (with a generated-types drift
check) on every push/PR — red CI blocks merge. `deploy.yml` deploys from `main` only and is inert
until repo variable `DEPLOY_ENABLED=true` and the deploy secrets are set.

---

## 5. Working with the AI agent team

| Agent | Ask it for | Typical trigger |
|---|---|---|
| **product-owner** | Decisions, priorities, acceptance criteria, resolving open KB questions | An open question blocks implementation |
| **business-analyst** | Turning fuzzy requirements into concrete rules; updating the KB after decisions | New/ambiguous business rule |
| **designer** | Screen flows, information architecture, wireframes | Feature needs a concrete flow before coding |
| **frontend-developer** | Building the Expo/React Native implementation | Flow confirmed + prioritized |
| **backend-developer** | Supabase schema/migrations, RLS, RPCs & triggers, Edge Functions, Render services | Feature needs a data model or API/RPC contract |
| **qa-automation** | Test suites (unit/component/RLS-integration), quality gates, bug→regression tests | Before any merge to main; whenever a bug is reported |

Handoff pattern: **business-analyst** (what are the rules?) → **product-owner** (is it decided and
prioritized?) → **designer** (what does it look like?) → **backend-developer** (schema & RPC
contract) → **frontend-developer** (build the UI against that contract) → **qa-automation**
(coverage + gates before merge). Backend and frontend agree contracts up front and can then work in
parallel. Any agent that hits an unresolved business question routes it to product-owner; the
answer gets written back into the KB (by business-analyst) and, if technical, into `DECISIONS.md`.

---

## 6. Testing quick reference

Full rules in FRAMEWORK_RULES §6. In short:

- **Pure logic** (`src/features/*/logic/`): Jest unit tests — this is where the KB §2.3 status
  math lives; boundary cases are mandatory (Rule 6.2).
- **Screens/components**: React Native Testing Library — assert the four screen states.
- **RLS/RPCs/Edge Functions**: **Vitest** integration tests in `tests/db/` against the LOCAL
  Supabase stack (never mocked, never remote — Rules 6.5, 4.7), run with `npm run test:db` after a
  `npm run db:reset`. Every table needs a test proving user A cannot touch user B's rows. (Jest and
  Vitest are separate runners here — Jest ignores `tests/db/`; Jest specs import from
  `@jest/globals` explicitly.)
- **Bug fixes**: regression test first (it must fail before the fix, Rule 6.3).

---

## 7. Common pitfalls (learned rules — add yours here)

- **Don't** put the `service_role` key anywhere the app can see it (`.env` `EXPO_PUBLIC_*`,
  `app.json`, source) — server-side only (Rule 3.6).
- **Don't** change schema through Supabase Studio — migrations only (Rule 4.1).
- **Don't** hand-edit `src/types/database.types.ts` — regenerate it (`npm run db:types`).
- **Don't** hardcode the maintenance-metric list — metrics are user-extensible rows (Rule 8.3).
- **Don't** write trip distance to a metric's `last_service_km` — trip distance increments the
  vehicle's single shared odometer via one RPC, nothing else (KB §2.3, Rule 4.5).
- **Don't** fetch with `useEffect` + `useState` — server state goes through TanStack Query (Rule 3.3).
- The toolchain is pinned to **Expo SDK 54** (FRAMEWORK_RULES Rule 0.3 / DECISIONS D-SDK54) because
  target devices can't run SDK 57. That means ESLint **v9** + `eslint-config-expo@~10`,
  `jest-expo@~54`, TypeScript `~5.9`, RN `0.81.5`. The `eslint-import-resolver-typescript` override
  (`^4.4.5`) in `package.json` keeps import resolution working — keep it. Don't bump the SDK, ESLint,
  or the Expo config without confirming device support.
- **RLS policies are not enough in this Supabase CLI version** — new `public` tables are not
  auto-exposed to `anon`/`authenticated`, so a table with RLS but no `GRANT` returns "permission
  denied" for everyone. Every table migration must include both the RLS policies **and** the
  matching `GRANT`s (reference tables: `GRANT SELECT` to `authenticated` only). See the existing
  migrations for the pattern.
- **Local analytics is disabled** in `supabase/config.toml` (`[analytics] enabled = false`): its
  logflare container failed its health check and tore down the whole local stack on `supabase
  start`. Pure dev-tooling, no schema impact — leave it off.
- **`npx expo install <pkg>` / `--fix` can silently change the Expo SDK version.** The SDK is pinned
  to **54** (Rule 0.3, D-SDK54). After any dependency change, `git diff package.json` and revert
  unintended expo/react-native/typescript churn (pin back + `rm -rf node_modules package-lock.json
  && npm install`). Prefer already-installed SDK-54 Expo modules over adding new native deps.

---

## 8. Hosted setup — running without a local dev server (DEMO_FEEDBACK_003 #3, D-DEMO3)

Everything above describes the **local dev loop**: `supabase start` on your machine + `expo start
--tunnel` + Expo Go. That's the right setup for active development, but it means every session
needs a running local Supabase stack and a fresh tunnel — not something you want end users doing.
This section covers the two moves that eliminate that: hosting Supabase in the cloud, and building
a real, installable app instead of running one through Expo Go.

**Accounts needed** (none of these can be created or paid for by an AI agent — a human has to do
this step): a free [Supabase](https://supabase.com) account, a free
[Expo/EAS](https://expo.dev) account, and — for iOS specifically — an
[Apple Developer Program](https://developer.apple.com/programs/) membership (**$99/year**; required
for TestFlight/App Store distribution, not needed for local simulator builds).

### 8.1 Move Supabase to the cloud

1. Create a project at [supabase.com](https://supabase.com) (pick a region close to your users).
   Two projects if you follow Rule 4.8 — one for `staging`, one for `production`; one is enough to
   get started.
2. `npx supabase login` (opens a browser to authenticate the CLI).
3. `npx supabase link --project-ref <your-project-ref>` — the ref is in the project's dashboard URL
   (`supabase.com/dashboard/project/<ref>`) or Settings → General.
4. `npx supabase db push` — applies every migration in `supabase/migrations/` to the cloud project,
   in order. This is the same schema you've been testing locally.
5. **Do not run `supabase/seed.sql` against this project** — it's local-dev-only fixture data (a
   fake user, a fake vehicle) per Rule 4.7. Real users sign up and onboard normally instead.
6. Grab the **Project URL** and **anon key** from Settings → API in the dashboard.
7. Point the app at them: update `.env` (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
   with the cloud values instead of the `127.0.0.1:54321` local ones. For a real build (§8.2) these
   go into **EAS secrets** instead of a local `.env` file, so they're baked into the build, not
   dependent on your machine.

Once this is done, `npx expo start --tunnel` (or a real build) talks to the cloud project directly — no
`supabase start`, no Docker, no local port, from any machine.

### 8.2 Get the app onto an iPhone without touching source code (EAS Build + TestFlight)

This is the actual fix for "I don't want to run anything locally to open the app" — a real,
installed app icon on your phone, built once in the cloud, that never talks to a dev server.

1. `npm install -g eas-cli` (or use `npx eas-cli` each time without a global install).
2. `eas login` — sign in with your Expo account.
3. `eas build:configure` — links this project to your EAS account and fills in
   `extra.eas.projectId` in `app.json` (a placeholder `ios.bundleIdentifier` /
   `android.package` of `com.motocompanion.app` is already set in `app.json` — change it first if
   you want a different one, since it can't be changed after your first App Store Connect upload).
4. Build: `eas build --profile preview --platform ios` (the `preview` profile is defined in
   `eas.json` — internal distribution, not a public App Store release). EAS builds in the cloud, so
   **no Mac is required**; it walks you through Apple sign-in and can manage signing certificates
   for you the first time.
5. Distribute via **TestFlight** (recommended — easiest for testers, no manual device
   registration): `eas submit --platform ios` uploads the build to App Store Connect, then invite
   testers by email under TestFlight there. They install the free **TestFlight** app from the App
   Store, accept the invite, and get your app as a normal icon on their home screen.
   - Alternative for a single device without TestFlight: **ad-hoc distribution**, which requires
     registering that specific device's UDID with Apple first — more manual, only worth it for one
     or two personal test devices.
6. From then on: open the app icon. No source code, no `npx`, no port, no Codespace. It talks
   straight to the cloud Supabase project from §8.1.
7. **Shipping a JS-only change later** (no new native dependency) doesn't require a new build:
   `eas update` pushes an over-the-air update to everyone who has the app installed. A new native
   dependency (e.g. a different `expo-*` module) does need a new `eas build`.

Android is the same shape — `eas build --profile preview --platform android` produces an `.apk`
you can send directly (no Play Store account required to just install and test it, unlike iOS).

### 8.3 What's still local right now

As of this doc, the app is still running against the **local** Supabase stack + Expo Go tunnel from
earlier sessions — §8.1/§8.2 above are the documented path, not yet executed, because both need
your own Supabase/Expo/Apple accounts and payment details, which an AI agent cannot create or hold.
See `DECISIONS.md` `D-DEMO3` for the full record and current status.

---

## 9. Document status

- **Version**: 1.2 (2026-07-18) — added §8 (hosted Supabase + EAS/TestFlight iOS access) after
  DEMO_FEEDBACK_003.
- Keep §7 alive: when you hit a non-obvious problem another agent will hit too, add the lesson here
  (workflow lessons) or in FRAMEWORK_RULES (binding rules) via PR.
