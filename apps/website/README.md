# Stores4U Website

This is the SvelteKit product app for Stores4U. It owns routing, server logic, auth wiring, oRPC handlers, Mistral invoice OCR, and the dashboard UI.

## App Model

- Single store per server, created once through `/setup`.
- Single SQLite database from `DATABASE_PATH`, shared by Better Auth and store data.
- First account becomes `owner`; later signup is closed until the invite flow exists.
- Dashboard routes require `owner`, `admin`, or `member`.
- Public OAuth can create the first owner only during first run. After setup, OAuth is sign-in only for linked accounts.

## Local Development

Run from the repository root:

```bash
bun install
cp apps/website/.env.example .env
mkdir -p databases
bun run db:generate
bun run db:migrate
bun run dev
```

The SvelteKit config reads environment variables from the repository root, so keep the runtime `.env` at the root.

## Scripts

Package scripts are usually run through the root Turbo scripts:

- `bun run dev` - Vite dev server with host binding
- `bun run build` - production build with `svelte-adapter-bun`
- `bun run preview` - preview the built app
- `bun run typecheck` - `svelte-check`
- `bun run test` - Vitest unit tests

## Main Routes

- `/setup` - first-run owner and store setup
- `/signin` - dashboard sign-in
- `/` - dashboard overview
- `/checkout`, `/orders`, `/products`, `/products/categories`
- `/purchases/invoices`, `/purchases/suppliers`
- `/inventory/movements`, `/settings`
- `/accounts` - account area
- `/health` - health check

## Local Packages

- `@repo/database` - Drizzle schema and SQLite client factory
- `@repo/config` - shared enums and domain constants
- `@repo/ui` - shared Svelte components and styles
