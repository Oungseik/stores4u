# apps/website

## Purpose

The SvelteKit application — the dashboard product. Single-store-per-server: one store, role-based dashboard staff, one SQLite database.

## Ownership

Owns: routing, UI, server logic (oRPC handlers, better-auth, mastra agents). The Drizzle schema and SQLite client factory live in `@repo/database` (`packages/database`); `src/lib/server/db` is a thin env-wiring shim that opens the `bun:sqlite` client from `DATABASE_PATH`, calls `createDb`, and re-exports everything from `@repo/database`.

## Local Contracts

- **One database**: the schema lives in `@repo/database` (`packages/database/src/schema`), which merges better-auth tables (`auth.ts`, `shop-info.ts`) with the store domain (`product`, `order`, `supplier`, `customer`, `inventory`, `purchaseInvoice`, `tax`, `image`) and one merged `relations.ts`. `src/lib/server/db/index.ts` is the env-wiring shim: it reads `DATABASE_PATH` from `$env/static/private`, opens the `bun:sqlite` client, and calls `createDb`; it re-exports `drizzle-orm` operators and the full schema from `@repo/database`. Handlers keep importing tables, operators, and `db` from `$lib/server/db` (the shim) or directly from `@repo/database`.
- **Foreign keys are enforced**: `createDb` runs `PRAGMA foreign_keys = ON`, so the schema's `references()` + `onDelete` rules fire. Hard-delete handlers must guard history before deleting (see `delete_supplier`, `delete_category`, `delete_invoice_file`); a `references()` with no `onDelete` blocks the delete at the DB when child rows exist. Exception: `customers.delete` needs no guard — `order.customerId` is `ON DELETE SET NULL`, so deleting a customer orphans order links while the order's snapshot columns (`customer_name`/`customer_phone`) keep historical invoices intact.
- **Product removal is soft-delete**: `products.delete` sets `product.isArchived = true`; the row stays so order / inventory / purchase-invoice history keeps its FK target. Active-catalog reads (`products.list`, `products.checkout`, `products.stats`, `dashboard.stats`) filter `isArchived = false`; history reads (orders, inventory movements, `products.statsProduct` by id, `products.get`) still include archived products.
- **Add/edit management routes**: customers and suppliers use dedicated add/edit pages (`/customers/add`, `/customers/[id]/edit`, `/purchases/suppliers/add`, `/purchases/suppliers/[supplierId]/edit`) that mirror product add/edit pages. Add/edit navigation uses anchors styled with `buttonVariants`, not click handlers that call `goto` or open dialogs.
- **Single store + roles**: the `shop` table has no `slug` and no `userId`; it is the one global shop row. `user.role` is `owner`, `admin`, `member`, or `user`. Dashboard access is `owner` / `admin` / `member`; `user` is reserved for future storefront/customer API accounts.
- **First-run gate**: `src/hooks.server.ts` exports `setupGate` (runs before `authHandle`). With no users, it redirects everything to `/setup` except `/setup`, `/health`, static assets, first-owner auth endpoints (`sign-up/email`, `sign-in/email`, `sign-in/social`, OAuth callbacks, verify/session reads), and `/rpc/setup/*` (the setup create mutation). With users but no shop, `/setup` stays reachable (along with `/signin`, auth, and `/rpc/setup/*`) so an OAuth-created first owner can finish store setup. Once the shop exists, `/setup` and public email signup are closed.
- **Auth model**: better-auth `admin` plugin is enabled with `owner` as the only plugin admin role for now. The drizzle adapter is wired as `drizzleAdapter(db, { provider: "sqlite", schema })` with the bundled tables map from `@repo/database` — drizzle 1.x dropped `db._.fullSchema`, so without `schema` the adapter throws "Schema not found" at init; `admin` and `member` are dashboard staff roles without Better Auth user-management power until the invite hierarchy exists. `accountLinking.disableImplicitLinking: true` blocks email-match implicit linking. `/signup` is closed (redirects to `/signin`). `/signin` is email/password UI only; linked Google/Facebook accounts can still sign in via the Better Auth OAuth endpoint, while unlinked OAuth cannot create accounts after setup. **No mail transport (local-only / offline-capable)**: email verification, email-OTP forgot-password, and email-based 2FA are removed; 2FA is TOTP-only (authenticator app via the `twoFactor` plugin). `/forgot-password` and `/verify-account` routes are gone; offline owner/admin password reset is `scripts/reset-password.ts` (bypasses the session-gated `/admin/set-user-password`; owner/admin roles only).
- **Routing**: no slug segment. Dashboard lives under the `(dashboard)` group at `/`, accounts at `/accounts`. First-run routing is owned by `setupGate` in `hooks.server.ts` (see First-run gate above); dashboard/accounts layouts require a session with role `owner`, `admin`, or `member`.
- **POS flow**: `/cart` (Point of Sale — build the cart via barcode scan or product search) → `/checkout` (review, attach a customer, place the order) → `/orders/[id]`. Cart state is shared client-side via `src/lib/cart.svelte.ts`, a Svelte 5 reactive class backed by runed `PersistedState` (`localStorage`, key `stores4u:cart`) — a refresh keeps the cart; SSR-safe (server singleton stays empty). The customer is optional: walk-in (default, anonymous) or an existing/new customer attached as `customerId` (the `checkout` handler snapshots `customer_name`/`customer_phone` onto the order). `/checkout` has a client-side empty-cart guard that bounces back to `/cart`. The sidebar/CTA entry point is `Point of Sale` → `/cart`.
- **Setup is load + oRPC**: `/setup` has a `+page.server.ts` `load` returning `{ needsAccount }` (whether the first owner still needs creating) for form rendering, and `orpc.setup.create` (mutation) creates the first owner via `auth.api.signUpEmail` when needed and inserts the one shop row. The page uses tanstack/svelte-form + tanstack-query; the client `goto`s `/signin?setup=1` (owner just created) or `/` (owner already signed in). Reachability is owned by `setupGate` (see First-run gate); the handler is the auth/role trust boundary.
- **oRPC**: `src/lib/server/orpc/base.ts` defines `authMiddleware` and `shopMiddleware` / `protectedShopMiddleware` (resolve the single store, no input). `protectedShopMiddleware` requires a dashboard role and the single shop row. `setupCreateHandler` (`orpc.setup.create`) additionally enforces a global shop-count guard (one shop per server) and is the only shop-creation mutation. Handlers import the single `db` directly from `$lib/server/db`; there is no per-request db middleware.
- **Invoice AI (no chat)**: `src/lib/server/mastra` holds only the invoice extraction/verification agents and `_lib/image-utils.ts`, called from `orpc.purchaseInvoices.processFile` during the invoice review workflow. The conversational shop-assistant chat (`/chats`, `/api/ai/shop-assistant`, mastra registry, store memory, and the `threads` oRPC router) has been removed.
- **File storage keys** (S3/R2): no slug prefix — `images/...`, `invoice-files/...`, `avatars/...`.

## Work Guidance

- `DATABASE_PATH` must be set (see `.env.example`). Run `bun run db:push` to create/sync the schema into the SQLite file.
- Drizzle migrations (`drizzle/`) are gitignored; use `db:push` for dev and `db:generate` + `db:migrate` for production.
- Offline password reset: `RESET_EMAIL=... RESET_PASSWORD=... bun run scripts/reset-password.ts` resets an owner/admin password directly against `DATABASE_PATH` (lockout escape hatch; bypasses the session-gated admin API; both email + password read from env so neither hits argv / shell history). Owner/admin roles only; refuses member/user.

## Verification

- `bun run test` (Vitest unit tests)
- `bun run typecheck` (svelte-check, 0 errors expected)
- `bun run dev` then smoke routes: `/`, `/setup`, `/signin`, `/health`

## Child DOX Index

- `src/lib/server/db` — thin env-wiring shim over `@repo/database` (reads `DATABASE_PATH`, builds `db`/`client`, re-exports schema + operators).
- `src/lib/server/orpc` — oRPC router, handlers, middlewares.
- `src/lib/server/mastra` — invoice AI agents (extraction/verification) + `_lib/image-utils.ts`, used by the purchase-invoice workflow.
