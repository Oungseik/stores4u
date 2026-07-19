# System Review Backlog

Address one item at a time, in listed order unless a dependency requires otherwise. Each item is complete only when its acceptance checks and relevant repository verification pass.

## Critical — release blockers

- [x] **SEC-01 — Enforce owner-only settings at the API boundary**
  - Replace dashboard-role authorization with `ownerMiddleware` for store, tax, and invoice-setting mutations.
  - Cover direct admin/member RPC calls with authorization tests.
  - Files: `apps/website/src/lib/server/orpc/handlers/{shops/update_shop,invoice/update_invoice_settings,tax/update_tax_settings}.ts`.
  - Acceptance: all three mutations run `ownerMiddleware` before resolving the shop; direct calls from both `admin` and `member` reject with `FORBIDDEN` in `owner-mutations.test.ts`.

- [ ] **SEC-02 — Prevent same-origin stored XSS from uploads**
  - Validate purchase-invoice content from magic bytes rather than caller MIME or filename.
  - Generate canonical extensions; never serve uploaded HTML as active same-origin content.
  - Reject, sanitize, or rasterize SVG product images.
  - Add safe response headers and regression tests for disguised HTML and active SVG.
  - Files: upload handlers, `src/lib/server/storage.ts`, and `/storage/[...key]`.

- [ ] **SEC-03 — Protect internal catalog RPC reads**
  - Require a dashboard role for product/category reads unless a separate storefront-safe API is deliberately introduced.
  - Do not expose cost or internal stock data publicly.
  - Add maximum page sizes and unauthenticated-request tests.

## High — data correctness

- [ ] **DATA-01 — Resolve one database path consistently in local development**
  - Make relative `DATABASE_PATH` values resolve from the repository root in both Drizzle commands and the website process, or require an absolute path everywhere.
  - Prove migration and runtime open the same temporary database.
  - Update setup documentation and env comments.

- [ ] **DATA-02 — Make stock subtraction concurrency-safe**
  - Move the stock sufficiency condition into the transactional update and check affected rows.
  - Do not insert a movement when the stock update fails.
  - Add a concurrent subtraction regression test.

- [ ] **DATA-03 — Enforce valid checkout money and quantities**
  - Prevent discounts from producing negative totals.
  - Decide whether quantities are integral or fractional; then keep stock and cent calculations consistent and rounded.
  - Add boundary tests for excessive discounts and fractional quantities.

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

- [ ] **BUILD-01 — Add every website runtime/build variable to Turbo tracking**
  - At minimum add `STORAGE_DRIVER` and `STORAGE_LOCAL_DIR` to root `turbo.json` `globalEnv`.
  - Audit SMTP, logging, and OpenTelemetry variables against actual runtime usage.
  - Verify changing storage driver invalidates the website build cache.

## Deployment validation

- [ ] **DEPLOY-01 — Smoke-test the Linux installer with Caddy/systemd**
- [ ] **DEPLOY-02 — Smoke-test the Windows installer with Caddy/WinSW**
- [ ] **DEPLOY-03 — Exercise update rollback against a real migrated database**

## Baseline verification

The review baseline passed:

- `bun run check`
- `bun run test` (11 tests)
- `bun run build`
- `bun test deploy/deploy.test.ts` (5 tests)
- `cd apps/website && bun src/lib/server/ocr/mistral-invoice.check.ts`
- `bash -n deploy/linux.sh`
- `git diff --check`

Target-OS deployment smoke tests were not available in the review environment.
