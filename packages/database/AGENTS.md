# packages/database

## Purpose

The single-store database package: merged Drizzle schema, Turso/libSQL client factory, and deploy-time migration config.

## Ownership

Owns `src/schema/**`, `createDb(client)`, `drizzle.config.ts`, committed `drizzle/` migrations, and the `db:*` scripts.

## Local Contracts

- One Turso database stores Better Auth and store-domain data. Runtime and migration credentials are `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; there is no local production SQLite file or per-store database.
- `src/index.ts` re-exports Drizzle operators, the full schema, and `relations`; `createDb` builds the async `drizzle-orm/libsql/web` instance from a libSQL client.
- Transaction callbacks and their queries are async. Await the transaction and every query inside it; Bun SQLite's synchronous `.run()`, `.get()`, `.all()`, and relational `.sync()` APIs are not valid.
- `relations.ts` exports the bundled `schema` object required by Better Auth's Drizzle adapter.
- The schema merges Better Auth tables with the store domain and app-owned invite table. `shop` is one global row with no owner FK.
- Depends on `@repo/config` for shared country/currency enums.

## Work Guidance

- Root `.env` supplies Turso credentials to Drizzle Kit through `with-env`.
- Generated migrations live in committed `./drizzle`. Run `bun run db:generate` after schema edits and commit the result.
- Production migrations run only through root `bun run deploy` or `scripts/deploy-new-account.sh`; do not migrate on Worker startup or as part of normal development.
- Build JavaScript with `tsdown --no-dts`; use `tsgo --noEmit` for type checking.

## Verification

- `bun run build`
- `bun run typecheck`
- `bun run test`
- Validate deploy migrations against a disposable libSQL database when migration files change.

## Child DOX Index

_none_
