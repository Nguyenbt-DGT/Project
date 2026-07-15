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
| 5 | [KICKOFF_NOTES.md](KICKOFF_NOTES.md) | Vision/ideas — NOT in scope unless product-owner prioritizes |
| 6 | `DECISIONS.md` | Decision log — check it before proposing a change of direction |

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
npx expo start              # 4. run the app (scan QR with Expo Go, or press i / a / w)
```

Or simply run the slash command **`/run-app-local`** in Claude Code — it performs all of the
above with preflight checks and reports the URLs.

npm scripts you'll use constantly:

| Script | Does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the repo |
| `npm test` | Jest (unit + component) |
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

---

## 5. Working with the AI agent team

| Agent | Ask it for | Typical trigger |
|---|---|---|
| **product-owner** | Decisions, priorities, acceptance criteria, resolving open KB questions | An open question blocks implementation |
| **business-analyst** | Turning fuzzy requirements into concrete rules; updating the KB after decisions | New/ambiguous business rule |
| **designer** | Screen flows, information architecture, wireframes | Feature needs a concrete flow before coding |
| **frontend-developer** | Building the Expo/React Native implementation | Flow confirmed + prioritized |

Handoff pattern: **business-analyst** (what are the rules?) → **product-owner** (is it decided and
prioritized?) → **designer** (what does it look like?) → **frontend-developer** (build it). Any
agent that hits an unresolved business question routes it to product-owner; the answer gets written
back into the KB (by business-analyst) and, if technical, into `DECISIONS.md`.

---

## 6. Testing quick reference

Full rules in FRAMEWORK_RULES §6. In short:

- **Pure logic** (`src/features/*/logic/`): Jest unit tests — this is where the KB §2.3 status
  math lives; boundary cases are mandatory (Rule 6.2).
- **Screens/components**: React Native Testing Library — assert the four screen states.
- **RLS/RPCs/Edge Functions**: integration tests against the LOCAL Supabase stack (never mocked,
  never remote — Rules 6.5, 4.7). Every table needs a test proving user A cannot touch user B's rows.
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
- ESLint must stay on **v9** until `eslint-config-expo` supports v10 (its bundled plugins crash on
  v10), and `eslint-import-resolver-typescript` is pinned to ^4 via `overrides` in `package.json`
  for TypeScript 6 compatibility. Don't "upgrade" either without checking Expo support.

---

## 8. Document status

- **Version**: 1.0 (2026-07-15)
- Keep §7 alive: when you hit a non-obvious problem another agent will hit too, add the lesson here
  (workflow lessons) or in FRAMEWORK_RULES (binding rules) via PR.
