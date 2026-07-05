# packages/database

## Purpose

The single-store database package: the merged Drizzle schema, a SQLite client factory, and Drizzle Kit config/scripts.

## Ownership

Owns: `src/schema/**` (better-auth tables + store domain tables + one merged `relations.ts`), the `createDb` client factory, `drizzle.config.ts`, and the `db:*` scripts.

## Local Contracts

- Single SQLite database at `DATABASE_PATH` (default `databases/store.db`). No Turso, no per-store files.
- `src/index.ts` re-exports `drizzle-orm` operators, the full schema, and `relations`; exports `createDb(client)` which builds the Drizzle instance from a `bun:sqlite` client. `createDb` runs `PRAGMA foreign_keys = ON` on the client so the schema's declared `references()` + `onDelete` rules are enforced (SQLite ships FK enforcement OFF; neither drizzle nor `bun:sqlite` flips it).
- `relations.ts` also exports a bundled `schema` object (the full tables map). Drizzle 1.x no longer exposes `db._.fullSchema`, so better-auth's drizzle adapter needs `schema` passed explicitly — `createDb` consumers (e.g. `apps/website` auth) import this `schema` and hand it to `drizzleAdapter(db, { provider, schema })`.
- The schema merges better-auth tables (`auth.ts`, `shop-info.ts`) with the store domain (`product`, `order`, `supplier`, `inventory`, `purchaseInvoice`, `tax`, `image`). `shop` is one global row with no `userId` owner FK. `product` carries an `isArchived` soft-delete flag (archive-only; a hard delete would orphan `order_item` / `inventory_movement` / `purchase_invoice_item` history, which have no `onDelete`).
- `user` carries the better-auth `admin` plugin columns: `role` (`"owner" | "admin" | "member" | "user"`, default `"user"`), `banned`, `banReason`, `banExpires`. `session` carries `impersonatedBy`. Dashboard authorization is based on `user.role`; there is no shop-role column and no `shopRoles` enum.
- Consumed by `apps/website` through its env-wiring shim at `src/lib/server/db` (which reads `DATABASE_PATH` via `$env/static/private`, opens `new Database(...)`, and calls `createDb`). The package itself never touches SvelteKit `$env`.
- Depends on `@repo/config` (country/currency/social enums used by the auth + shop-info schema).

## Work Guidance

- `DATABASE_PATH` must be set (see root `.env`). The package scripts load it via `with-env` (`dotenv -e ../../.env --`).
- `bun run db:push` (root turbo task) creates/syncs the schema into the SQLite file.
- Generated migrations live in `./drizzle` (gitignored); use `db:push` for dev and `db:generate` + `db:migrate` for production.

## Verification

- `bun run typecheck` (root turbo → `tsgo --noEmit` here via `@typescript/native-preview`, 0 errors expected)

## Child DOX Index

_none_
