# Stores4U

Single-store point-of-sale, inventory, purchasing, and dashboard app built with SvelteKit.

## Runtime

- Bun server via `svelte-adapter-bun` on an AWS Lightsail VM
- One Turso/libSQL database for Better Auth and store data
- Local-disk upload storage via `STORAGE_DIR`
- One store per deployment, created through `/setup`

## Local development

Run the one-time interactive setup, then start Vite:

```bash
nix develop
bun run setup
bun run dev
```

Setup installs JavaScript dependencies, authenticates Turso when needed, creates or reuses the isolated `stores4u-dev` Turso database, writes generated development credentials to ignored root `.env`, prepares the local storage directory, and applies committed migrations. `bun run dev` only starts the app; it does not provision resources or run migrations.

After schema changes, generate and commit migrations:

```bash
bun run db:generate
```

## Deploy to production

Prepare ignored root `.env.prod` from `.env.example`: set `PUBLIC_ENVIRONMENT=production`, an HTTPS `BETTER_AUTH_URL`, plus `GOOGLE_*` and `MISTRAL_API_KEY` as needed. Then:

```bash
bun run deploy
```

The script validates `.env.prod`, builds first, then applies committed migrations to Turso. Delivering the built output to the Lightsail VM is operator work until a dedicated VM bootstrap script lands: sync the repository there, run `nix run .#website` (or sync `apps/website/build/` with dependencies), set `STORAGE_DIR` for uploaded files, load `.env.prod` into the service environment, and restart it behind TLS. Credentials are reused rather than regenerated. Migrations never run during app startup.

## Commands

- `bun run setup` — provision and configure a development machine
- `bun run dev` — local Vite development
- `bun run build` — build the workspaces and the Bun-server output
- `bun run deploy` — validate `.env.prod`, build, migrate Turso
- `bun run typecheck` — type checks
- `bun run test` — Vitest tests
- `bun run check` — typecheck, lint, and format
- `bun run db:generate` — generate a migration after schema edits
- `bun run db:studio` — open Drizzle Studio against Turso

## Project structure

```text
apps/website        SvelteKit application (svelte-adapter-bun)
nix                 Dendritic flake-parts modules
packages/config     Shared enums and domain constants
packages/database   Drizzle schema, Turso client factory, committed migrations
packages/ui         Shared Svelte 5 UI components
scripts             Development setup and production deployment automation
```
