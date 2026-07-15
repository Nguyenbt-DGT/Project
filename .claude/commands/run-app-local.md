---
description: Boot the full local dev environment — local Supabase stack + Expo dev server — and report status
argument-hint: [ios|android|web] (optional platform hint for the Expo dev server)
allowed-tools: Bash, Read, Glob, Grep
---

# Job: Run the app locally

Bring up the complete local development environment for the Moto Companion App and leave it
running. Follow [docs/FRAMEWORK_RULES.md](../../docs/FRAMEWORK_RULES.md) — especially Rule 4.7
(local dev runs against the local Supabase stack, NEVER the production project).

Platform argument (optional): `$ARGUMENTS`

## Steps

1. **Preflight checks** (fix what you can, report what you can't):
   - `node_modules` exists → if missing, run `npm install`.
   - Docker daemon is running (`docker info`) → required for local Supabase; if unavailable, stop
     and tell the user Supabase local needs Docker.
   - `.env` exists → if missing, copy `.env.example` to `.env` and fill the Supabase values in
     step 3.

2. **Start local Supabase**: check `npx supabase status` first — if already running, reuse it.
   Otherwise run `npx supabase start` (in the background; it can take a few minutes on first run).

3. **Wire the environment**: from `npx supabase status`, take the local `API URL` and `anon key`
   and make sure `.env` has them as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
   Never write the `service_role` key into `.env` (Rule 3.6).

4. **Sync the database**: if there are migrations in `supabase/migrations/` that are newer than the
   running DB state (or if the user asks for a clean slate), run `npx supabase db reset` to apply
   migrations + `seed.sql`. Then regenerate types:
   `npx supabase gen types typescript --local > src/types/database.types.ts` — report if the
   generated file changed (that means committed types were stale).

5. **Start the Expo dev server** in the background: `npx expo start` (append `--ios`, `--android`,
   or `--web` if a platform argument was given). Watch the output for the QR code / URLs and for
   bundler errors.

6. **Report** (final message):
   - Supabase: API URL, Studio URL, DB status, whether migrations/seed were applied.
   - Expo: dev server URL, how to open the app (QR / simulator), any bundler warnings.
   - Anything that failed and what you did about it.

## Rules

- Do NOT stop the servers at the end — the user wants them running.
- If a port is already in use, find what's using it and report it; do not kill processes without
  saying so.
- If the app cannot boot due to a code error, report the exact error and offer to fix it — do not
  silently patch code as part of this command.
