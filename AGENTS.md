# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:

- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Work Guidance

- Work through the correctness and feature backlog in root `SYSTEM_REVIEW.md` one item at a time, keeping its checkboxes and acceptance notes current.
- Turbo runs in strict environment mode; add every Worker runtime/build variable used by an app to root `turbo.json` `globalEnv`. Purchase-invoice OCR requires `MISTRAL_API_KEY` there so root `.env` reaches `apps/website`.
- Biome treats unused imports as lint errors repo-wide (`correctness.noUnusedImports: "error"`).
- Vitest is the sole test framework repo-wide. Root `bun run test` runs website and database projects under Bun; do not import `bun:test` or add another runner.
- Nix uses the dendritic pattern: root `flake.nix` wires `flake-parts` + `import-tree`, while feature modules live under `nix/`. Wrangler is re-exported from the pinned `Oungseik/dentritic-nix-config` input; use the Nix-provided CLI, never a direct `package.json` dependency or `bunx`.

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

- **Product name**: the public website and installable app name is exactly `stores4u`.
- **Single-store deployment**: this app supports ONE store per Cloudflare Worker deployment (not SaaS / multi-tenant). The store is set up once through the `/setup` wizard. There is no shop switcher, no per-store routing, no slug, and no `shop.userId` ownership link.
- **Single Turso database**: all data (better-auth + store domain) lives in one Turso/libSQL database configured by `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. There is no local production database and no per-store database.
- **Roles**: `user.role` is one of `owner`, `admin`, `member`, `user`. Dashboard access is `owner` / `admin` / `member`; `user` is reserved for future storefront/customer API accounts and must not access the dashboard.
- **Owner-only sections**: `/settings` (Shop Settings = Profile / Business / Tax, plus Receipt settings) and the **Team** group (Management `/team` = invite-member + reset-for-user; Members `/team/members` = read-only staff list) are owner-only. Admins/members cannot reach them — sidebar entries are hidden and the routes redirect non-owners to `/`. This is deliberate: store config and staff onboarding are owner responsibilities.
- **First owner, created on first run**: the very first user ever created becomes `role = "owner"` with `emailVerified = true`. A `databaseHooks.user.create.before` hook in `apps/website/src/lib/server/auth.ts` grants that role + verified flag by checking whether any user already exists, and blocks all other raw signUpEmail/OAuth signup after setup. Later dashboard-staff accounts are created only through the owner's invite-link flow (see below).
- **No public signup after setup**: `/signup` is closed and redirects to `/signin`; `/api/auth/sign-up/email` is closed once the shop exists. `/setup` creates the first owner by email/password on a clean DB, or completes store setup for the first owner if that owner was created through first-run OAuth.
- **Invite-only dashboard staff (link-based)**: the owner generates one-time, 15-min invite links (`orpc.invites.create`) and hands them over manually. `/invite?token=` lets the recipient set name/email/password and creates the account with the role baked into the token (`orpc.invites.accept`). No email-based invite, no public staff signup.
- **Link-first auth**: email delivery is disabled on Workers until an HTTP email provider is configured. Verification, recovery, magic-link, and invite flows continue to render copyable links and never depend on email delivery. Two-factor authentication is removed at this time. See `apps/website/AGENTS.md` Auth model.
- **Google OAuth only**: during first run only, `/api/auth/sign-in/social` and `/api/auth/callback/*` may create the first `owner`. After that, Google OAuth can sign in only to an already-linked account. `accountLinking.disableImplicitLinking: true` blocks email-match implicit linking; the user create hook blocks raw OAuth signup after setup. Facebook OAuth is not supported.
- **Invite flow = deferred**: owners will invite admins/members later; admins may eventually manage members/users but must not promote owners without a dedicated hierarchy check. Do not expose public staff/customer signup from the dashboard.
- **No Docker deployment**: do not maintain Dockerfile, `.dockerignore`, Docker Compose, or Docker image deployment workflows for this repo.
- **Cloudflare Worker production**: production builds with `@sveltejs/adapter-cloudflare` and deploys through Wrangler. Ignored root `.env.prod` persistently owns production credentials. Root `bun run deploy` loads that file, builds first, applies committed Drizzle migrations to Turso, then atomically deploys code and secrets with `wrangler deploy --secrets-file`; it never rotates credentials. `scripts/deploy-new-account.sh` is the interactive fresh-account bootstrap: it switches CLI accounts, provisions Turso/R2, writes generated credentials to `.env.prod`, follows the same build → migrate → deploy order, then smoke-tests the instance. Do not run migrations on Worker startup or during normal development.
- **Reproducible isolated development**: `bun run setup` is the one-time interactive machine bootstrap. It authenticates Turso/Cloudflare when needed, creates or reuses the dedicated `stores4u-dev` Turso database and R2 bucket, writes development-only database/auth values to ignored root `.env`, and applies committed migrations. `bun run dev` only starts localhost and uses those prepared resources through Wrangler `env.dev`; it must not provision or migrate. Never point normal development at production Turso, R2, or auth credentials.
- **Cloudflare R2 file storage**: uploads live in the Worker `STORAGE` R2 binding and are served through `/storage/[...key]`. There is no local filesystem storage backend.
- **Store timezone**: `shop.timezone` (IANA name) defaults to the Worker runtime timezone and is user-selectable at `/setup` and editable by the owner in Settings → Business. DB stays UTC; only date boundaries (today/week/month) and chart day-buckets are computed in the store tz; display labels render the server-bucketed date key in UTC so they match regardless of the viewer's browser tz. Not per-user — one tz for the whole store.
- **User language preference (URL-first, browser-local fallback)**: each dashboard user selects `en` or Myanmar Unicode `my` under `/accounts`; English is default. Paraglide strategy `["url", "preferredLanguage", "cookie", "baseLocale"]` keeps Myanmar routes under `/my/...` (English uses the unprefixed base route), with `PARAGLIDE_LOCALE` as a browser fallback; internal links, programmatic navigation, and redirects must localize paths so navigation preserves the active language. The choice does NOT follow the account to another device, and there is no `user.language` DB read/write. All application UI is localized, while user/store data, English date/number/currency formatting, email content, and receipt/invoice document content stay unchanged. Backend display errors carry language-neutral message keys + interpolation values and are rendered through frontend catalogs; unknown errors use a localized generic fallback. See `CONTEXT.md` for the distinction from future Store Document Language.

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Child DOX Index

- `nix` — dendritic flake-parts modules for development and website outputs. See `nix/AGENTS.md`.
- `apps/website` — the SvelteKit application (the product). See `apps/website/AGENTS.md`.
- `packages/config` — shared config, enums, domain constants. See `packages/config/AGENTS.md`.
- `packages/database` — single-store Drizzle schema, Turso/libSQL client factory, Drizzle Kit config. See `packages/database/AGENTS.md`.
- `packages/ui` — shared Svelte UI component library. See `packages/ui/AGENTS.md`.
- `scripts` — development setup plus Turso/Cloudflare production provisioning and deployment automation. See `scripts/AGENTS.md`.
