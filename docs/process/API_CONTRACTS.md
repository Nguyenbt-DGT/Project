# API / Data Contracts — Moto Companion App

> **Owners**: `backend-developer` and `frontend-developer` jointly. **Referenced by**:
> `backend-developer.md` and `frontend-developer.md` agent instructions as the single source of
> truth for table/RPC/Edge Function contracts between client and server, and by `qa-automation.md`
> for contract-conformance testing.
>
> **What this is**: every data/API need that crosses the client/server boundary gets one row here
> *before* either side builds against assumptions. If a contract changes after the frontend has
> already built against it, that's a breaking change — flag it explicitly here rather than silently
> altering the RPC signature.

| Contract | Type (Table / RPC / Edge Function) | Signature / Shape | Consumers | Status | Last updated |
|---|---|---|---|---|---|
| _(none recorded yet)_ | | | | | |

## Status values
- **Draft** — proposed, not yet built against by the other side.
- **Stable** — built and in use; changing it is a breaking change.
- **Breaking change pending** — signature is changing; note what's changing and who's affected until both sides have adapted.
- **Deprecated** — superseded, kept for reference only.
