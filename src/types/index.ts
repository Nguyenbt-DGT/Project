// Shared domain types (Rule 2.4: discriminated unions, not boolean flags).
// Database row types are GENERATED into ./database.types.ts (Rule 2.3) — never hand-written.

/** KB §2.3 — maintenance metric status, increasing in severity. */
export type MetricStatus = 'ok' | 'warning' | 'overdue';
