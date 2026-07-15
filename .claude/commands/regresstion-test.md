---
description: Full regression suite — clean DB rebuild, all tests including RLS/RPC against local Supabase, coverage of KB business rules
argument-hint: [feature] (optional: health-check | touring-plan | map-tracking to focus the analysis)
allowed-tools: Bash, Read, Glob, Grep
---

# Job: Regression test

Run the complete verification suite from a clean slate and report every regression. This is the
gate before merging to `main` (FRAMEWORK_RULES Rule 6.4 — Definition of Done, and Rule 7.4).
Slower than `/smoke-test` is expected and fine.

Optional focus argument: `$ARGUMENTS`

## Steps

1. **Clean baseline**:
   - `git status` — note uncommitted changes (they are part of what's being tested; just record it).
   - Ensure dependencies are installed and the local Supabase stack is running (start it if not —
     requires Docker; if Docker is unavailable, run steps 2–3 only and mark the DB suite SKIPPED,
     verdict at best PARTIAL).

2. **Static gates**: `npx tsc --noEmit` and `npx eslint .`

3. **Full unit & component suite**: `npx jest --coverage --silent`. Record coverage for
   `src/features/*` — pure business-logic files (Rule 1.3) with low coverage are findings.

4. **Database rebuild from migrations**: `npx supabase db reset` — this itself is a test: every
   migration must apply cleanly on a fresh DB, and `seed.sql` must load. A failing migration is a
   critical regression.

5. **Type drift check**: regenerate types
   (`npx supabase gen types typescript --local > src/types/database.types.ts`) and `git diff` the
   result. A diff means schema and committed types are out of sync (Rule 2.3 violation).

6. **DB/RLS/RPC suite**: run the integration tests against the local stack (e.g.,
   `npx vitest run` in the DB test folder, per project setup). Verify especially:
   - Every table has RLS enabled (query `pg_tables`/`pg_policies` if no test covers it — a table
     without RLS is a release blocker, Rule 4.2).
   - The Rule 6.2 business-rule cases: status boundaries (`remaining == 0` → overdue,
     `remaining == warning_threshold` → warning), dual-axis worse-of-two, and trip-distance
     accumulation touching only the shared odometer.

7. **Regression analysis**: for every failure, identify what changed — check `git log` /
   `git diff main...HEAD` for the code most recently touching the failing area — and classify:
   **regression** (worked before, broken by a change), **pre-existing** (already broken on main),
   or **missing coverage** (rule required by FRAMEWORK_RULES §6 with no test).

## Report format (final message)

```
REGRESSION TEST: PASS | FAIL | PARTIAL (skipped suites listed)
Gates:      typecheck / lint
Unit:       passed/failed/total, coverage of src/features/*
Migrations: clean reset ✅/❌ ; type drift ✅/❌
DB/RLS:     passed/failed/total ; tables without RLS: [...]
Business rules (Rule 6.2): covered / missing: [...]
```

Then, per failure: the failing test/step, exact error, classification
(regression / pre-existing / missing coverage), suspected commit or file, and a suggested fix
direction. **Do not fix anything as part of this command** — report only; the user decides.

## Rules

- Never let the DB suite run against a remote/production Supabase project (Rule 4.7). Verify the
  URL in use is local (`127.0.0.1`/`localhost`) before running it.
- Missing test coverage for a mandatory Rule 6.2 case makes the verdict FAIL even if everything
  that exists passes.
