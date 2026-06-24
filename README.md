# Stores4U

Stores4U is a single-store point-of-sale, inventory, purchasing, and dashboard app.

This repository is a Bun workspace managed with Turbo. The product is the SvelteKit app in `apps/website`; shared domain constants, database schema, and UI components live under `packages/`.

## Current Contracts

- One store per server. Setup happens once through `/setup`; there is no shop switcher, slug routing, or multi-tenant ownership model.
- One local SQLite database at `DATABASE_PATH` stores both Better Auth data and store data.
- The first user ever created becomes `owner`. Later public signup is closed; future staff creation is invite-only.
- Dashboard access is limited to `owner`, `admin`, and `member`. The `user` role is reserved for future customer/storefront accounts.
- i18n is wired through Paraglide/Inlang, but the checked-in project currently has one locale: `en`.

## Prerequisites

- Bun, matching the root `packageManager` (`bun@1.2.8`)
- Git
- Native libraries needed by `sharp`/SvelteKit on your OS, or `nix develop`

## Local Setup

```bash
bun install
cp apps/website/.env.example .env
mkdir -p databases
bun run db:push
bun run dev
```

Open the dev server, complete `/setup`, then sign in as the first owner.

## Commands

- `bun run dev` - start the website dev server through Turbo
- `bun run build` - build all workspaces with a build script
- `bun run preview` - preview the built website
- `bun run check-types` - run type checks
- `bun run check` - run workspace checks
- `bun run test` - run workspace tests
- `bun run format` - run workspace formatting
- `bun run db:push` - sync the Drizzle schema into the SQLite database
- `bun run db:generate` - generate Drizzle migrations
- `bun run db:migrate` - apply Drizzle migrations
- `bun run db:studio` - open Drizzle Studio

## Project Structure

```text
apps/website        SvelteKit product app
packages/config     Shared enums and domain constants
packages/database   Drizzle schema, SQLite client factory, Drizzle Kit config
packages/ui         Shared Svelte 5 UI component library
```

## Stack

- SvelteKit, Svelte 5, TypeScript, Vite, Tailwind CSS
- Better Auth for authentication
- Drizzle ORM with Bun SQLite
- oRPC and TanStack Query for typed client/server data flow
- Mastra/OpenRouter/Replicate for AI-assisted workflows
- Paraglide/Inlang for localization
- Biome, Prettier, ESLint, Vitest, Turbo

## UI Components

Shared components are exported from `@repo/ui`.

```bash
bun run shadcn <component-name>
bun run shadcn-extras <component-name>
```

The root scripts target `packages/ui`.
