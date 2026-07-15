# Feature: health-check (KB §2)

Layout per FRAMEWORK_RULES §1:

```
index.ts     Public API — the ONLY entry point for code outside this feature (Rule 1.2)
screens/     Screen components rendered by the thin routes in /app
components/  Feature-specific UI pieces
hooks/       TanStack Query hooks (Rule 3.3) and other feature hooks
api/         Supabase calls (via @/lib/supabase) and RPC wrappers (Rule 4.5)
logic/       PURE TypeScript business logic — no React, no Supabase (Rule 1.3)
```

`logic/` is where the KB §2.3 status computation lives (`remaining`, `ok|warning|overdue`,
dual-axis worse-of-two). It is the primary unit-test target (Rule 6.2).
