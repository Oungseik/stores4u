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

- `bun install` runs `scripts/prepare-effect.sh`, which ensures `.repos/effect` exists as an ignored local clone of `https://github.com/Effect-TS/effect-smol` for Effect reference work.

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

- **Single-store deployment**: this app supports ONE store per server (not SaaS / multi-tenant). The store is set up once during install via the `/setup` wizard. There is no shop switcher, no per-store routing, no slug, and no `shop.userId` ownership link.
- **Single SQLite database**: all data (better-auth + store domain) lives in one local SQLite file at `DATABASE_PATH` (default `databases/store.db`). No Turso, no per-store DB files.
- **Roles**: `user.role` is one of `owner`, `admin`, `member`, `user`. Dashboard access is `owner` / `admin` / `member`; `user` is reserved for future storefront/customer API accounts and must not access the dashboard.
- **First owner, created on first run**: the very first user ever created becomes `role = "owner"`. A `databaseHooks.user.create.before` hook in `apps/website/src/lib/server/auth.ts` sets that role by checking whether any user already exists. Later account creation is invite-only and currently deferred.
- **No public signup after setup**: `/signup` is closed and redirects to `/signin`; `/api/auth/sign-up/email` is closed once the shop exists. `/setup` creates the first owner by email/password on a clean DB, or completes store setup for the first owner if that owner was created through first-run OAuth.
- **Social OAuth**: during first run only, `/api/auth/sign-in/social` and `/api/auth/callback/*` may create the first `owner`. After that, OAuth can sign in only to an already-linked account. `accountLinking.disableImplicitLinking: true` blocks email-match implicit linking; the user create hook blocks raw OAuth signup after setup.
- **Invite flow = deferred**: owners will invite admins/members later; admins may eventually manage members/users but must not promote owners without a dedicated hierarchy check. Do not expose public staff/customer signup from the dashboard.
- **No Docker deployment**: do not maintain Dockerfile, `.dockerignore`, Docker Compose, or Docker image deployment workflows for this repo.

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Child DOX Index

- `apps/website` — the SvelteKit application (the product). See `apps/website/AGENTS.md`.
- `apps/api` — the Bun TypeScript Effect v4 API app with generated OpenAPI/Scalar docs. See `apps/api/AGENTS.md`.
- `packages/config` — shared config, enums, domain constants. See `packages/config/AGENTS.md`.
- `packages/database` — single-store Drizzle schema, SQLite client factory, Drizzle Kit config. See `packages/database/AGENTS.md`.
- `packages/ui` — shared Svelte UI component library. See `packages/ui/AGENTS.md`.
