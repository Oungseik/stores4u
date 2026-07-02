# apps/api

## Purpose

The Bun TypeScript API app. It is a separate backend process intended to grow into the Effect-based replacement for website backend behavior.

## Ownership

Owns: API runtime entrypoints and future backend orchestration for HTTP, jobs, queues, cron, and retries.

## Local Contracts

- Keep this app separate from `apps/website`; migrate backend behavior deliberately.
- Reuse repo packages when needed instead of duplicating domain code or database schema.

## Work Guidance

- Start with `bun run dev --filter=api` from the repository root or `bun run dev` inside `apps/api`.
- Effect language-service is configured in `tsconfig.json`; editors must use the workspace TypeScript version for the plugin to load.

## Verification

- `bun run check-types`

## Child DOX Index

_none_
