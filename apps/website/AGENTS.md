# apps/website

## Purpose

The SvelteKit application — the entire product. Single-store-per-server: one store, one owner, one SQLite database.

## Ownership

Owns: routing, UI, server logic (oRPC handlers, better-auth, mastra agents). The Drizzle schema and SQLite client factory live in `@repo/database` (`packages/database`); `src/lib/server/db` is a thin env-wiring shim that opens the `bun:sqlite` client from `DATABASE_PATH`, calls `createDb`, and re-exports everything from `@repo/database`.

## Local Contracts

- **One database**: the schema lives in `@repo/database` (`packages/database/src/schema`), which merges better-auth tables (`auth.ts`, `shop-info.ts`) with the store domain (`product`, `order`, `supplier`, `inventory`, `purchaseInvoice`, `refund`, `tax`, `image`) and one merged `relations.ts`. `src/lib/server/db/index.ts` is the env-wiring shim: it reads `DATABASE_PATH` from `$env/static/private`, opens the `bun:sqlite` client, and calls `createDb`; it re-exports `drizzle-orm` operators and the full schema from `@repo/database`. Handlers keep importing tables, operators, and `db` from `$lib/server/db` (the shim) or directly from `@repo/database`.
- **Single store**: the `shop` table has no `slug`. There is at most one `shop` row per user (the owner). Setup happens once via the `/setup` route (`routes/setup`), which calls `shops.create`.
- **Routing**: no slug segment. Dashboard lives under the `(dashboard)` group at `/`, chats at `/chats`, accounts at `/accounts`. `(dashboard)/+layout.server.ts` and `chats/+layout.server.ts` load the single store and redirect to `/setup` if none exists (or `/signin` if no session).
- **oRPC**: `src/lib/server/orpc/base.ts` defines `authMiddleware` and `shopMiddleware` / `protectedShopMiddleware` (resolve the single store, no input). Handlers import the single `db` directly from `$lib/server/db`; there is no per-request db middleware.
- **AI chat memory**: `src/lib/server/mastra/_lib/memory.ts` exports `getStoreMemory()` — one memory over `DATABASE_PATH`, resource id `"store"`. No per-store key.
- **File storage keys** (S3/R2): no slug prefix — `images/...`, `invoice-files/...`, `avatars/...`.

## Work Guidance

- `DATABASE_PATH` must be set (see `.env.example`). Run `bun run db:push` to create/sync the schema into the SQLite file.
- Drizzle migrations (`drizzle/`) are gitignored; use `db:push` for dev and `db:generate` + `db:migrate` for production.

## Verification

- `bun run check-types` (svelte-check, 0 errors expected)
- `bun run dev` then smoke routes: `/`, `/setup`, `/signin`, `/health`

## Child DOX Index

- `src/lib/server/db` — thin env-wiring shim over `@repo/database` (reads `DATABASE_PATH`, builds `db`/`client`, re-exports schema + operators).
- `src/lib/server/orpc` — oRPC router, handlers, middlewares.
- `src/lib/server/mastra` — Mastra agents and store memory.
