---
name: backend-developer
description: Implement and update oRPC backend APIs in this POS SvelteKit monorepo using Drizzle ORM, Better Auth, and per-shop SQLite databases. Use when tasks ask to add or modify handlers under apps/website/src/lib/server/orpc/handlers, register procedures in apps/website/src/lib/server/orpc/router.ts, build or compose middleware in apps/website/src/lib/server/orpc/base.ts, inspect schemas and relations in packages/auth/src and packages/db/src, add inventory/product/shop/auth APIs, or implement cursor pagination for TanStack infinite queries.
---

# Backend Developer

## Overview

Implement backend API handlers with oRPC in `apps/website`, backed by Drizzle in `@repo/auth` and `@repo/db`. Follow existing project conventions for authentication, authorization, pagination, and router registration.

## Workflow

1. Identify which database owns the feature.
   - Use auth database (`@repo/auth`) for authentication and shop ownership tables.
   - Use shop database (`@repo/db`) for POS domain tables like product, inventory, invoices, categories, and suppliers.
2. Read entry points and relations before writing queries.
   - Read `packages/auth/src/index.ts` and `packages/auth/src/schema/relations.ts`.
   - Read `packages/db/src/index.ts` and `packages/db/src/schema/relations.ts`.
3. Create or update the handler in `apps/website/src/lib/server/orpc/handlers/<domain>/<action>.ts`.
4. Define Zod input and route semantics.
   - Add `.route({ method: "GET" })` for read-only handlers.
   - Omit GET route for mutating handlers.
5. Apply middleware in `apps/website/src/lib/server/orpc/base.ts`.
   - Build middleware for authentication, tenancy, role checks, feature flags, rate limits, or other cross-cutting checks.
   - Compose middleware with `concat(...)` to refine context and input requirements incrementally.
   - Narrow nullable or broad context types into stricter types inside middleware before handler execution.
6. Implement DB logic with Drizzle.
   - Prefer query builders and relation-aware queries that match `defineRelations`.
   - Keep UUID handling consistent with schema defaults; use UUIDv7 whenever generating IDs.
7. Register handlers in `apps/website/src/lib/server/orpc/router.ts`.
8. Run type checks for affected packages before finishing.

## Project Rules

- Treat auth and shop data as separate databases.
- Respect per-shop database design. Do not assume a single global shop DB connection for all requests.
- Keep oRPC context and middleware context extensions explicit and typed.
- Treat `concat` as a generic middleware composition tool, not only an RBAC pattern.
- Use middleware to narrow context types, for example from `session?: Session | null` to guaranteed `session`.
- Return predictable API shapes for list endpoints: `{ items, pageSize, nextCursor }`.
- Use cursor pagination for infinite queries:
  - Input includes `cursor?: string` and `pageSize: number`.
  - Query with stable ascending sort by UUIDv7 ID.
  - Fetch `pageSize + 1`, pop last row when over limit, expose `nextCursor`.

## Implementation Checklist

1. Map feature tables and relations from both schema packages.
2. Confirm whether endpoint is read-only or mutating, then set route method.
3. Define input schema and middleware ordering.
4. Implement handler with correct database client.
5. Register router path.
6. Validate type usage and handler response shape.

## References

- For file map, conventions, and templates, read [references/orpc_backend_patterns.md](references/orpc_backend_patterns.md).
