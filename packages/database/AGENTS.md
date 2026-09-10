# packages/database

## Purpose

The single-store database package: merged Drizzle schema, Turso/libSQL client factory, and deploy-time migration config.

## Ownership

Owns `src/schema/**`, `createDb(client)`, `drizzle.config.ts`, committed `drizzle/` migrations, and the `db:*` scripts.

## Local Contracts

- One Turso database stores Better Auth and store-domain data. Runtime and migration credentials are `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; there is no local production SQLite file or per-store database.
- `src/index.ts` re-exports Drizzle operators, the full schema, and `relations`; `createDb` builds the async `drizzle-orm/libsql/web` instance from a libSQL client.
- Transaction callbacks and their queries are async. Await the transaction and every query inside it; Bun SQLite's synchronous `.run()`, `.get()`, `.all()`, and relational `.sync()` APIs are not valid.
- `relations.ts` exports the bundled `schema` map used by both `defineRelations` and Better Auth's Drizzle adapter. It must contain every table Better Auth writes, `verification` included: better-auth 1.7 registers the map check at adapter init and runs it on every auth request by default (`advanced.database.validateSchema`), so a missing table fails requests with a schema-mismatch error.
- The schema merges Better Auth tables with the store domain and app-owned invite table. `shop` is one global row with no owner FK.
- `receipt_settings` is the singleton display configuration for paid customer POS receipts; supplier documents remain purchase invoices.
- Depends on `@repo/config` for shared country/currency enums.

## Work Guidance

- Root `.env` supplies Turso credentials to Drizzle Kit through `with-env`.
- Generated migrations live in committed `./drizzle`. Run `bun run db:generate` after schema edits and commit the result.
- Production migrations run only through root `bun run deploy` or `scripts/deploy-new-account.sh`; do not migrate on Worker startup or as part of normal development.
- Build JavaScript with `tsdown --no-dts`; use `tsc --noEmit` (stable TypeScript 7) for type checking.

## Verification

- `bun run build`
- `bun run typecheck`
- `bun run test`
- Validate deploy migrations against a disposable libSQL database when migration files change.

## Child DOX Index

_none_
