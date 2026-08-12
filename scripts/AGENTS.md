# scripts

## Purpose

Interactive operational scripts for development setup and production provisioning/deployment.

## Ownership

Owns `setup-dev.sh`, the one-time development-machine bootstrap; `deploy.ts`, the normal production deploy pipeline; and `deploy-new-account.sh`, the fresh Turso/Cloudflare account bootstrap.

## Local Contracts

- Never hardcode, print, or commit credentials. Ignored root `.env` owns generated development values; ignored root `.env.prod` owns generated Turso and Better Auth credentials plus operator-supplied production values.
- Development setup authenticates existing Turso/Cloudflare accounts when needed, creates or reuses isolated `stores4u-dev` resources, updates `.env`, and applies committed migrations. `bun run dev` performs none of these operations.
- Fresh-account deployment authenticates the target accounts, provisions Turso and R2, then builds → migrates → deploys code and secrets together with `wrangler deploy --secrets-file` before live smoke checks.
- Reuse an existing `BETTER_AUTH_SECRET`; normal deployments must not rotate credentials.
- Worker and R2 names come from `apps/website/wrangler.jsonc`; Turso group, database, and location may be overridden through the documented environment variables.
- Migrations run only from explicit setup/deploy commands, never Worker startup or `bun run dev`.

## Work Guidance

- Keep the script interactive and fail clearly before destructive or ambiguous account changes.
- Use installed CLIs and shell/platform tools; Wrangler comes from the root Nix dev shell, never `bunx` or a direct npm dependency.

## Verification

- `bash -n scripts/setup-dev.sh`
- `./scripts/setup-dev.sh --help`
- `bun scripts/deploy.ts --check`
- `bash -n scripts/deploy-new-account.sh`
- `./scripts/deploy-new-account.sh --help`

## Child DOX Index

_none_
