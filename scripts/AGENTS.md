# scripts

## Purpose

Interactive operational scripts for provisioning and deploying Stores4U instances.

## Ownership

Owns `deploy.ts`, the normal production deploy pipeline, and `deploy-new-account.sh`, the fresh Turso/Cloudflare account bootstrap.

## Local Contracts

- Never hardcode, print, or commit credentials. Ignored root `.env.prod` persistently owns generated Turso and Better Auth credentials plus operator-supplied production values.
- Fresh-account deployment authenticates the target accounts, provisions Turso and R2, then builds → migrates → deploys code and secrets together with `wrangler deploy --secrets-file` before live smoke checks.
- Reuse an existing `BETTER_AUTH_SECRET`; normal deployments must not rotate credentials.
- Worker and R2 names come from `apps/website/wrangler.jsonc`; Turso group, database, and location may be overridden through the documented environment variables.
- Do not add startup or development migrations.

## Work Guidance

- Keep the script interactive and fail clearly before destructive or ambiguous account changes.
- Use installed CLIs and shell/platform tools; do not add deployment dependencies.

## Verification

- `bun scripts/deploy.ts --check`
- `bash -n scripts/deploy-new-account.sh`
- `./scripts/deploy-new-account.sh --help`

## Child DOX Index

_none_
