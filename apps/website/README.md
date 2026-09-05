# Stores4U Website

The SvelteKit product app served by `svelte-adapter-bun`. It uses Turso/libSQL for data and local-disk storage (`STORAGE_DIR`) for uploads.

## Development

Run from the repository root:

```bash
bun install
cp .env.example .env
bun run dev
```

Root `.env` must provide Turso and Better Auth credentials. Uploads go to gitignored `apps/website/.storage` unless `STORAGE_DIR` is set.

## Production

Use root `bun run deploy` with ignored root `.env.prod`. It validates credentials, builds the Bun-server output, then applies committed Drizzle migrations to Turso. Delivering `apps/website/build/` to the Lightsail VM, loading `.env.prod` plus `STORAGE_DIR` into its service environment, and restarting are operator steps (see root README). Do not add startup migrations.

Required service environment:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `STORAGE_DIR`

## Main routes

- `/setup` — first owner and store setup
- `/signin` — dashboard sign-in
- `/` — dashboard
- `/checkout`, `/orders`, `/products`, `/products/categories`
- `/purchases/invoices`, `/purchases/suppliers`
- `/inventory/movements`, `/settings`, `/accounts`
- `/health` — health check
