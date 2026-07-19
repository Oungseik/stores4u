# src/lib/server/orpc

## Purpose

The website's oRPC trust boundary: shared context/middleware, router composition, handlers, and direct-handler security regressions.

## Ownership

Owns: `base.ts`, `router.ts`, `handlers/`, and colocated `*.test.ts` files.

## Local Contracts

- Catalog reads are internal dashboard APIs. `products.list`, `products.get`, `categories.list`, and `categories.getProducts` use `protectedShopMiddleware`; there is no public storefront catalog API. Product responses may contain cost and stock fields.
- Product and category list inputs cap `pageSize` at 100.
- Store, tax, and invoice-setting mutations run `ownerMiddleware` before `shopMiddleware`.
- Manual stock subtraction uses a conditional stock update inside its transaction; a failed update records no inventory movement.
- `protectedShopMiddleware` rejects missing sessions and non-dashboard roles before resolving the single shop.

## Work Guidance

- Put authorization middleware before database work and cover trust-boundary changes with direct `@orpc/server` `call` tests.
- Return language-neutral error keys in `ORPCError.data`; frontend catalogs own user-facing localization.

## Verification

- `bun --bun run test:unit -- --run`
- `bun run typecheck`

## Child DOX Index

None.
