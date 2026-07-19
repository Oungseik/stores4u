# Stores4U Website

The SvelteKit product app deployed to Cloudflare Workers. It uses Turso/libSQL for data and the `STORAGE` Cloudflare R2 binding for uploads.

## Development

Run from the repository root:

```bash
bun install
cp .env.example .env
bun run dev
```

Root `.env` must provide Turso and Better Auth credentials. Wrangler configuration is in `wrangler.jsonc`; local Vite development receives its Cloudflare bindings through the adapter proxy.

## Deployment

Use root `bun run deploy` with ignored root `.env.prod`. It builds the Worker, applies committed Drizzle migrations to Turso, then deploys code and secrets together through Wrangler. Do not add startup migrations.

Required Worker secrets:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Create the R2 bucket named in `wrangler.jsonc` before first deploy.

## Main routes

- `/setup` — first owner and store setup
- `/signin` — dashboard sign-in
- `/` — dashboard
- `/checkout`, `/orders`, `/products`, `/products/categories`
- `/purchases/invoices`, `/purchases/suppliers`
- `/inventory/movements`, `/settings`, `/accounts`
- `/health` — health check
