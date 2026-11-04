# CONTEXT.md — Risk-Copilot Domain Glossary

Maintained via the `domain-modeling` skill. Read this before touching code in an area it covers.

## Postgres MCP — credentials decision

`opencode.json` wires `crystaldba/postgres-mcp` (via `uvx`) to the local docker Postgres on `localhost:5432/risk_copilot`, currently **inline dev creds** (`postgres:postgres_dev` — the compose default, already visible in `docker-compose.yml`). Access mode is `restricted` (read-only transactions; blocked `commit`/`rollback` via `pglast` parsing).

**Pick an option only if requirements change:**

- **Inline (current)** — zero moving parts; fine while the only database is the local compose one. Revisit the day this project gains a shared/staging DB or the `opencode.json` lands in a public repo.
- **Env-var indirection (`{env:RISK_COPILOT_DATABASE_URI}`)** — config carries no credentials; `export` the URI in the shell profile. Cost: a missing var fails MCP startup with a confusing error. Choose when git hygiene outweighs convenience.
- **Dedicated read-only role** (`mcp_reader` with `SELECT` only) — structurally cannot write even if the model goes rogue; the read-only-transaction wrapper alone is bypassable. Overkill for local dev; choose when the DB contains data you'd regret losing (staging, shared, production).

The `restricted` access mode stays the default regardless of which credential option is chosen — it is the safety floor and costs nothing locally.