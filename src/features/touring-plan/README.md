# Feature: touring-plan (KB §3)

Layout per FRAMEWORK_RULES §1 — same shape as health-check:
`index.ts` (public API) · `screens/` · `components/` · `hooks/` · `api/` · `logic/` (pure).

Business link: before starting a planned trip, check the selected vehicle's HEALTH_CHECK status
via the health-check feature's public API (`@/features/health-check`) — never deep-import its
internals (Rule 1.2). Whether the pre-departure warning is blocking is an OPEN KB question (§2.4)
— escalate per Rule 8.2, don't guess.
