# scripts

## Purpose

Operational scripts for development setup and production build/migration.

## Ownership

Owns `setup-dev.sh`, the one-time development-machine bootstrap, and `deploy.ts`, the production validate → build → migrate pipeline.

## Local Contracts

- Never hardcode, print, or commit credentials. Ignored root `.env` owns generated development values; ignored root `.env.prod` owns generated Turso and Better Auth credentials plus operator-supplied production values.
- Development setup authenticates the existing Turso account when needed, creates or reuses isolated `stores4u-dev` resources, prepares local upload storage, updates `.env`, and applies committed migrations. `bun run dev` performs none of these operations.
- `deploy.ts` validates `.env.prod`, then builds, then applies committed migrations to Turso — always in that order. Delivering built code to the Lightsail VM and restarting its service is operator work until a VM bootstrap script lands here.
- Reuse an existing `BETTER_AUTH_SECRET`; normal deployments must not rotate credentials.
- Turso group, database, and location may be overridden through the documented environment variables in `setup-dev.sh --help`.
- Migrations run only from explicit setup/deploy commands, never app startup or `bun run dev`.

## Work Guidance

- Keep scripts interactive and fail clearly before destructive or ambiguous account changes.
- Use installed CLIs and shell/platform tools already present in the root Nix dev shell; avoid new CLIs when existing commands suffice.

## Verification

- `bash -n scripts/setup-dev.sh`
- `./scripts/setup-dev.sh --help`
- `bun scripts/deploy.ts --check`

## Child DOX Index

_none_
