// Vitest config for the DB/RLS/RPC integration suite (FRAMEWORK_RULES Rule 6.1: "API/DB —
// Vitest + local Supabase"). Deliberately separate from the jest-expo unit-test config
// (package.json "jest" block) so the two runners never pick up each other's test files — see
// package.json's jest.testPathIgnorePatterns, which excludes this suite's directory.
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirrors tsconfig.json's "@/*" -> "./src/*" path alias (this suite imports the generated
    // database types read-only, same as product code does).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/db/**/*.test.ts'],
    environment: 'node',
    // These tests share ONE live local Postgres instance (Rule 6.5 — real stack, not mocked).
    // Running test files in parallel workers would let independent files race against the same
    // database connection pool / seeded rows. Each file already isolates itself with its own
    // freshly-created fixtures (see tests/db/support.ts), but keeping file execution serial is a
    // cheap extra guard against flakiness and connection exhaustion.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
