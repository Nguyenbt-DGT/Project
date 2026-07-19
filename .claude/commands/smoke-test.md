---
description: Fast sanity check — typecheck, lint, unit tests, and app boot. Pass/fail verdict in a few minutes
argument-hint: [feature] (optional: home | health-check | touring-plan | map-tracking to scope the test run)
allowed-tools: Bash, Read, Glob, Grep
---

# Job: Smoke test

Run the fast verification suite and give a clear PASS/FAIL verdict. This is the quick gate a
developer runs before committing — it must stay fast (minutes, not tens of minutes). The heavier
suite is `/regresstion-test`.

Optional scope argument: `$ARGUMENTS` (a feature name — scope Jest to
`src/features/<feature>` when given).

## Steps (run 1–3 in parallel where possible)

1. **Typecheck**: `npx tsc --noEmit`
2. **Lint**: `npx eslint .`
3. **Unit & component tests**: `npx jest --silent` (scope with
   `npx jest src/features/$ARGUMENTS` if an argument was given). Do NOT run the DB/RLS or E2E
   suites here — those belong to `/regresstion-test`.
4. **Boot check**: verify the app bundle compiles — `npx expo export --platform web` (or, if the
   project isn't web-enabled, start `npx expo start` in the background just long enough to confirm
   the bundler reports a successful build, then stop it).

## Report format (final message)

```
SMOKE TEST: PASS | FAIL
- Typecheck:  ✅ / ❌ (error count)
- Lint:       ✅ / ❌ (error count; warnings noted separately)
- Unit tests: ✅ / ❌ (passed/failed/total, duration)
- App boot:   ✅ / ❌
```

For any ❌: quote the exact error (file:line and message), state the most likely cause in one
sentence, and — if the fix is a one-liner — suggest it. **Do not apply fixes as part of this
command**; the user decides what to do with the verdict.

## Rules

- Never mark PASS with skipped/failing steps. If a step can't run (e.g., dependencies not
  installed), the verdict is FAIL with the reason.
- If there are no tests yet for code that FRAMEWORK_RULES Rule 6.2 says must be tested (e.g.,
  metric status computation exists but has no spec), flag that as a warning in the report.
