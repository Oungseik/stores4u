# oRPC Backend Patterns

## File Map

- oRPC base and middleware: `apps/website/src/lib/server/orpc/base.ts`
- oRPC router: `apps/website/src/lib/server/orpc/router.ts`
- Existing handler example: `apps/website/src/lib/server/orpc/handlers/shops/create_shop.ts`
- Auth DB entrypoint: `packages/auth/src/index.ts`
- Auth relations: `packages/auth/src/schema/relations.ts`
- Shop DB entrypoint: `packages/db/src/index.ts`
- Shop relations: `packages/db/src/schema/relations.ts`
- Shop schema tables: `packages/db/src/schema/index.ts`

## Handler Template (Read-only)

Use GET for data retrieval handlers.

```ts
import { z } from "zod";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().positive(),
});

export const listSomethingHandler = os
  .route({ method: "GET" })
  .input(input)
  .handler(async ({ input }) => {
    const items = await db.query.someTable.findMany({
      where: { id: { gte: input.cursor } },
      orderBy: { id: "asc" },
      limit: input.pageSize + 1,
    });

    let nextCursor: string | undefined;
    if (items.length > input.pageSize) {
      const next = items.pop();
      nextCursor = next?.id;
    }

    return { items, pageSize: input.pageSize, nextCursor };
  });
```

## Handler Template (Mutation)

```ts
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { os } from "$lib/server/orpc/base";

const input = z.object({
  name: z.string().min(1),
});

export const createSomethingHandler = os
  .input(input)
  .handler(async ({ input }) => {
    const inserted = await db.insert(table).values({ name: input.name }).returning();
    const created = inserted.at(0);
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
    return created;
  });
```

## Middleware Composition and Type Narrowing

Use `concat` for any middleware composition, not only RBAC.

Define base middleware in `base.ts`, then compose for specific requirements:

```ts
import { ORPCError } from "@orpc/server";
import { os } from "$lib/server/orpc/base";

export const authMiddleware = os.middleware(async ({ context, next }) => {
  const session = context.session;
  if (!session) throw new ORPCError("UNAUTHORIZED");

  // Narrow session from nullable/optional to a guaranteed object.
  return next({ context: { ...context, session } });
});

export const shopScopeMiddleware = authMiddleware.concat(
  async ({ context, next }, input: { slug: string }) => {
    const shop = await db.query.shop.findFirst({
      where: { slug: input.slug, userId: context.session.user.id },
    });
    if (!shop) throw new ORPCError("FORBIDDEN");

    // Add scoped data to context for downstream handlers.
    return next({ context: { ...context, shop } });
  },
);
```

Common use cases for `concat`:
- auth -> tenant/shop scope
- auth -> feature flag guard
- auth -> rate limit guard
- auth -> RBAC/permission guard
- validation guard -> domain preconditions

## Router Registration Pattern

```ts
import { listProductsHandler } from "./handlers/products/list_products";

export const router = os.router({
  products: {
    list: listProductsHandler,
  },
});
```

## UUIDv7 Rule

- Keep IDs sortable for cursor pagination.
- Use schema defaults that generate UUIDv7 (`Bun.randomUUIDv7` or `randomUUIDv7`).
- Do not introduce UUIDv4 for new IDs.
