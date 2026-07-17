# Known Issues & Follow-ups

> Tracked limitations and polish items discovered during the HEALTH_CHECK MVP build (2026-07-17).
> These are **not** blockers for the Health MVP (which is implemented and passing all gates) but
> should be addressed before the relevant milestone. Deferred *scope* (as opposed to defects) lives
> in [DECISIONS.md](DECISIONS.md) `D-HEALTH-MVP-SCOPE`, not here.

| ID | Area | Issue | Impact | Suggested owner |
|---|---|---|---|---|
| KI-1 | Auth / web | `expo-secure-store` has **no web implementation**, so Supabase session persistence throws on the web target. | Browser-based auth/session testing is blocked; iOS/Android are unaffected. | frontend-developer / backend-developer — add a web storage fallback (e.g., a platform-split storage adapter) before relying on the web build for auth. |
| KI-2 | Health / copy | The remaining-value caption reads oddly once a part is Overdue (e.g., "Overdue 10,000 km … / 10,000 km remaining" instead of "overdue by X"). | Cosmetic; wording only, status/color are correct. | designer + business-analyst — confirm the Overdue caption wording (HEALTH_REQ §5 only specified the non-overdue template). |
| KI-3 | Health / axes | Remaining-value wording for the time and event-count axes ("195 days remaining", "1 event remaining") extends HEALTH_REQ §5's km/mi-only template — an implementation choice, not a specified rule. | Minor; needs product confirmation for consistency. | business-analyst / designer. |
| KI-4 | Health / Live Vitals | "Today's distance" sums trips recorded today regardless of whether `apply_trip_distance` has folded them into the odometer — an interpretation, since HEALTH_REQ §3 doesn't disambiguate. | Minor; edge behavior. | business-analyst to confirm intended definition. |

## Resolved during the build

- **Doc arithmetic error** (fixed): HEALTH_ACCEPTANCE AC-4 and DECISIONS D-UNIT-ROUNDING stated
  40,355 km = 25,076 mi; the correct value is **25,075 mi** (40355 × 0.621371 = 25,075.43). The
  product code and tests were already correct; the two docs were corrected to match.
- **`mark_service_done` lock ordering** (fixed by backend-developer): locked `service_items` before
  `vehicles`, a deadlock risk against the coupled oil-filter update; now always locks the vehicle
  first.
- **Mark-as-replaced price** (fixed by frontend-developer): entering a price on mark-as-replaced
  updated the Spend total but not the reminders footer, because the RPC doesn't touch `price_cents`;
  the mutation now writes `price_cents` alongside the spend entry.
