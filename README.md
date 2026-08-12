# Stores4U

Single-store point-of-sale, inventory, purchasing, and dashboard app built with SvelteKit.

## Runtime

- Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- One Turso/libSQL database for Better Auth and store data
- Cloudflare R2 for uploads
- One store per deployment, created through `/setup`

## Local development

Run the one-time interactive setup, then start Vite:

```bash
nix develop
bun run setup
bun run dev
```

The Nix shell supplies Wrangler from `Oungseik/dentritic-nix-config`. Setup installs JavaScript dependencies, authenticates Turso and Cloudflare when needed, creates or reuses the isolated `stores4u-dev` Turso database and R2 bucket, writes generated development credentials to ignored root `.env`, and applies committed migrations. `bun run dev` only starts the app; it does not provision resources or run migrations. Production continues to use the top-level `stores4u` binding and `.env.prod`.

After schema changes, generate and commit migrations:

```bash
bun run db:generate
```

## Deploy for another user

Prepare that user's optional OAuth/OCR credentials, then run the interactive bootstrap script:

```bash
cp .env.example .env.prod
# Set PUBLIC_ENVIRONMENT=production and BETTER_AUTH_URL to the final HTTPS URL;
# fill GOOGLE_* and MISTRAL_API_KEY as needed.
./scripts/deploy-new-account.sh
```

The script switches Turso and Cloudflare CLI accounts, creates the Turso database and R2 bucket, writes generated credentials into ignored root `.env.prod`, builds, migrates, atomically deploys code and secrets, and smoke-tests the new instance. Use `--keep-login` only when both CLIs already use the intended accounts. Defaults can be changed with `TURSO_GROUP_NAME`, `TURSO_DATABASE_NAME`, and `TURSO_LOCATION`; Worker and R2 names remain owned by `apps/website/wrangler.jsonc`.

For later deployments, keep the production credentials in `.env.prod` and run:

```bash
bun run deploy
```

Both paths load `.env.prod`, build first, apply committed migrations, then deploy code and secrets together with `wrangler deploy --secrets-file`. Credentials are reused rather than regenerated. Migrations do not run during Worker startup.

## Commands

- `bun run setup` — provision and configure a development machine
- `bun run dev` — local Vite development
- `bun run build` — build the workspaces and Cloudflare Worker output
- `bun run deploy` — build, migrate Turso, deploy the configured Worker
- `./scripts/deploy-new-account.sh` — provision and deploy a fresh Turso/Cloudflare account
- `bun run typecheck` — type checks
- `bun run test` — Vitest tests
- `bun run check` — typecheck, lint, and format
- `bun run db:generate` — generate a migration after schema edits
- `bun run db:studio` — open Drizzle Studio against Turso

## Project structure

```text
apps/website        SvelteKit Worker application and Wrangler config
nix                 Dendritic flake-parts modules
packages/config     Shared enums and domain constants
packages/database   Drizzle schema, Turso client factory, committed migrations
packages/ui         Shared Svelte 5 UI components
scripts             Development setup and production deployment automation
```
