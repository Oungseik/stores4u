# System Review Backlog

Address one item at a time, in listed order unless a dependency requires otherwise. Each item is complete only when its acceptance checks and relevant repository verification pass.

## Critical — release blockers

- [x] **SEC-01 — Enforce owner-only settings at the API boundary**
  - Replace dashboard-role authorization with `ownerMiddleware` for store, tax, and invoice-setting mutations.
  - Cover direct admin/member RPC calls with authorization tests.
  - Files: `apps/website/src/lib/server/orpc/handlers/{shops/update_shop,invoice/update_invoice_settings,tax/update_tax_settings}.ts`.
  - Acceptance: all three mutations run `ownerMiddleware` before resolving the shop; direct calls from both `admin` and `member` reject with `FORBIDDEN` in `owner-mutations.test.ts`.

- [x] **SEC-02 — Prevent same-origin stored XSS from uploads**
  - Validate purchase-invoice content from magic bytes rather than caller MIME or filename.
  - Generate canonical extensions; never serve uploaded HTML as active same-origin content.
  - Reject, sanitize, or rasterize SVG product images.
  - Add safe response headers and regression tests for disguised HTML and active SVG.
  - Files: upload handlers, `src/lib/server/storage.ts`, and `/storage/[...key]`.
  - Acceptance: invoice uploads accept only magic-byte-detected JPEG, PNG, or PDF content and use canonical keys/MIME; image uploads reject SVG and retain magic-byte-detected JPEG, PNG, or WebP with canonical extensions; storage responses derive safe types from keys, force unknown types to download, and set CSP, CORP, and anti-sniffing headers. Direct upload regressions cover disguised HTML and active SVG.

- [x] **SEC-03 — Protect internal catalog RPC reads**
  - Require a dashboard role for product/category reads unless a separate storefront-safe API is deliberately introduced.
  - Do not expose cost or internal stock data publicly.
  - Add maximum page sizes and unauthenticated-request tests.
  - Acceptance: product list/get and category list/product-membership reads use `protectedShopMiddleware`; list inputs cap `pageSize` at 100; direct-handler regressions reject missing sessions with `UNAUTHORIZED`, non-dashboard `user` sessions with `FORBIDDEN`, and page sizes above 100 with `BAD_REQUEST`.

## High — data correctness

- [x] **DATA-01 — Use one Turso database consistently**
  - Runtime, Drizzle Kit, and the password-reset script use `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`.
  - The Worker uses the web libSQL client; migrations use the committed Drizzle history.
  - Acceptance: the database factory executes against libSQL, the website builds for Workers, and deploy-time migration succeeds against a disposable libSQL database.

- [x] **DATA-02 — Make stock subtraction concurrency-safe**
  - Move the stock sufficiency condition into the transactional update and check affected rows.
  - Do not insert a movement when the stock update fails.
  - Add a concurrent subtraction regression test.
  - Acceptance: manual subtraction conditionally updates stock inside the transaction; only a successful update inserts its movement; two concurrent full-stock subtractions produce one success, one insufficient-stock rejection, zero remaining stock, and one movement.

- [x] **DATA-03 — Enforce valid checkout money and quantities**
  - Prevent discounts from producing negative totals.
  - Decide whether quantities are integral or fractional; then keep stock and cent calculations consistent and rounded.
  - Add boundary tests for excessive discounts and fractional quantities.
  - Acceptance: checkout rejects discounts above subtotal plus rounded VAT; checkout, manual adjustment, and purchase-invoice stock inputs require positive whole-unit quantities; direct checkout regressions reject excessive discounts and fractional quantities.

- [ ] **DATA-04 — Fix product image lifecycle and gallery behavior**
  - Reordering images must not delete retained objects.
  - Product detail must show every image exactly once.
  - Add reorder/removal regression coverage.

- [ ] **DATA-05 — Make product/category relationship writes atomic**
  - Wrap product + image + category writes in database transactions.
  - Validate or deduplicate relationship IDs before destructive replacement.
  - Ensure failed inserts preserve the previous state.

- [ ] **DATA-06 — Enforce one-time setup and invite consumption atomically**
  - Claim invites conditionally (`consumed_at IS NULL` and unexpired) inside the transaction.
  - Add a database-backed singleton guarantee or equivalent atomic claim for first-owner/shop setup.
  - Add concurrent request tests.

## Medium — reporting and feature completeness

- [ ] **REPORT-01 — Correct store-timezone order statistics**
  - Use the shared store timezone helpers for today/week/month boundaries.
  - Add a timezone-boundary regression test.

- [ ] **REPORT-02 — Fix revenue-trend range length**
  - A request for 7 or 30 days must return exactly 7 or 30 day buckets.

- [ ] **REPORT-03 — Correct product profit calculations**
  - Compute COGS from sale movements, not all purchase inventory.
  - Do not hide real losses by clamping estimated profit to zero.

- [ ] **FEATURE-01 — Implement or remove the no-op Shop Profile save**
  - Never present a save action that silently does nothing.

- [ ] **FEATURE-02 — Implement or remove mock notifications**
  - Notification preferences must persist before showing success.
  - The notification page must use real data or be removed from navigation.

- [ ] **FEATURE-03 — Decide remaining deferred UI scope**
  - Track thermal printing, team member management, and service-worker caching as separate features only when they are scheduled; do not present them as complete.

- [x] **BUILD-01 — Track Worker runtime/build variables**
  - Turbo tracks Turso, Better Auth, OAuth, OCR, and public app variables.
  - Local-storage, SMTP, Bun-server, and Node OpenTelemetry variables were removed with the local deployment runtime.

## Deployment validation

- [x] **DEPLOY-01 — Build and Wrangler dry-run the Cloudflare Worker**
- [x] **DEPLOY-02 — Apply committed migrations to a disposable libSQL database**
- [x] **DEPLOY-03 — Run the first authenticated live deploy and smoke `/health`, `/setup`, auth, Turso, and R2**
- [x] **DEPLOY-04 — Persist production credentials and deploy them atomically**
  - Ignored root `.env.prod` is reused by normal and fresh-account deployments.
  - Build and migration complete before `wrangler deploy --secrets-file` changes the live Worker; normal deploys do not rotate credentials.

## Baseline verification

The review baseline passed:

- `bun run check`
- `bun run test` (Vitest; 24 tests)
- `bun run typecheck`
- `bun run build`
- `cd apps/website && bunx wrangler deploy --dry-run`
- deploy-time migration against a disposable libSQL database
- authenticated deployment to `https://stores4u.mhemaungthuwin.workers.dev`
- live `/health`, `/setup`, Better Auth session, Turso migration replay, and R2 upload/read/delete smoke tests
- `git diff --check`
