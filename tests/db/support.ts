// Shared test tooling for the DB/RLS/RPC integration suite (FRAMEWORK_RULES Rule 6.1/6.5).
// Talks to the REAL local Supabase stack only — never a mocked client, never a remote project
// (Rule 4.7). The URL + anon key are read fresh from `npx supabase status`, matching the
// task instructions, rather than trusting `.env` to be in sync.

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

import type { Database } from '@/types/database.types';

interface LocalSupabaseConfig {
  apiUrl: string;
  anonKey: string;
  dbUrl: string;
}

let cachedConfig: LocalSupabaseConfig | undefined;

/** Reads connection info from `npx supabase status -o json` (never hardcoded), then hard-fails
 * if the URL isn't a loopback address — a guard against ever running this suite against a
 * remote/production project (Rule 4.7). */
export function getLocalSupabaseConfig(): LocalSupabaseConfig {
  if (cachedConfig) return cachedConfig;

  let stdout: string;
  try {
    stdout = execFileSync('npx', ['supabase', 'status', '-o', 'json'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    throw new Error(
      'Could not read `npx supabase status -o json` — is the local stack running? ' +
        'Start it with `npx supabase start` (Docker required) before running the DB suite. ' +
        `Original error: ${String(err)}`
    );
  }

  const parsed = JSON.parse(stdout) as { API_URL?: string; ANON_KEY?: string; DB_URL?: string };
  if (!parsed.API_URL || !parsed.ANON_KEY || !parsed.DB_URL) {
    throw new Error('`supabase status -o json` did not return API_URL/ANON_KEY/DB_URL.');
  }

  const isLocal = /^(https?:\/\/)?(127\.0\.0\.1|localhost)([:/]|$)/.test(parsed.API_URL);
  if (!isLocal) {
    throw new Error(
      `Refusing to run the DB suite against a non-local API_URL (${parsed.API_URL}). ` +
        'Rule 4.7: local dev tests must run against 127.0.0.1/localhost only, never remote.'
    );
  }

  cachedConfig = { apiUrl: parsed.API_URL, anonKey: parsed.ANON_KEY, dbUrl: parsed.DB_URL };
  return cachedConfig;
}

/** A fresh, session-isolated client (no localStorage/disk persistence — each test client is
 * independent, unlike the app's single shared client per Rule 4.4, which is a client-only rule). */
export function createTestClient(): SupabaseClient<Database> {
  const { apiUrl, anonKey } = getLocalSupabaseConfig();
  return createClient<Database>(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const SEED_USER = { email: 'rider@example.com', password: 'password123' };
export const SEED_VEHICLE_ID = '22222222-2222-2222-2222-222222222222';
export const SEED_TRIP_ID = '33333333-3333-3333-3333-333333333333';

/** Signs in as the seeded rider@example.com user (supabase/seed.sql). */
export async function signInAsSeedUser(): Promise<SupabaseClient<Database>> {
  const client = createTestClient();
  const { error } = await client.auth.signInWithPassword(SEED_USER);
  if (error) {
    throw new Error(
      `Could not sign in as the seed user (${SEED_USER.email}) — has \`npx supabase db reset\` ` +
        `been run against this stack? Original error: ${error.message}`
    );
  }
  return client;
}

/** Signs up a brand-new, throwaway user for cross-user RLS isolation tests. Local auth has
 * `enable_confirmations = false` (supabase/config.toml), so signUp returns an active session
 * immediately — no email-confirmation step needed. */
export async function signUpFreshUser(): Promise<{ client: SupabaseClient<Database>; userId: string; email: string }> {
  const client = createTestClient();
  const email = `qa-${randomUUID()}@example.com`;
  const password = 'password123';
  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user) {
    throw new Error(`Could not sign up a fresh test user: ${error?.message ?? 'no user returned'}`);
  }
  return { client, userId: data.user.id, email };
}

/** Direct Postgres connection for assertions PostgREST/RLS can't answer from the client side
 * (e.g. "does every public table have RLS enabled" — pg_catalog isn't exposed via the Data API).
 * Used ONLY for read-only schema audits, never to bypass RLS for business-rule assertions — those
 * go through the same supabase-js client path the app itself uses (Rule 6.5: exercise the real
 * stack, not a shortcut around it). */
let pgPool: Pool | undefined;
export function getAdminPgPool(): Pool {
  if (!pgPool) {
    const { dbUrl } = getLocalSupabaseConfig();
    pgPool = new Pool({ connectionString: dbUrl });
  }
  return pgPool;
}

export async function closeAdminPgPool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = undefined;
  }
}
