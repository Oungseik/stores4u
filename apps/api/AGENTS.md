# apps/api

## Purpose

The Bun TypeScript API app. It runs the Effect v4 beta HTTP API process intended to grow into the replacement for website backend behavior.

## Ownership

Owns: API runtime entrypoints, generated API documentation, and future backend orchestration for HTTP, jobs, queues, cron, and retries.

## Local Contracts

- Keep this app separate from `apps/website`; migrate backend behavior deliberately.
- Reuse repo packages when needed instead of duplicating domain code or database schema.
- The workspace package name is `@repo/api`; do not use bare `api`, which can collide with npm dependencies.
- Use `effect@4` beta APIs for this app. Prefer `effect/unstable/http` and `effect/unstable/httpapi`; do not add stable `@effect/platform*` packages unless they are compatible with Effect v4.
- Use the Effect logger for application logs. `console.*` is a Biome lint error in this app.
- HTTP routes currently owned here:
  - `GET /health` returns `{"status":"ok"}`.
  - `GET /openapi.json` returns the generated OpenAPI document from the `HttpApi` definition.
  - `GET /docs` serves the generated Scalar documentation from `HttpApiScalar`.
- `/health`, `/openapi.json`, and `/docs` are public and have no CORS middleware while the API only exposes health/docs.
- Runtime port comes from `PORT`, defaulting to `5000`. Package scripts load the repository root `.env`.

## Work Guidance

- `src/app.ts` owns the HTTP API/layer definition; `src/index.ts` owns Bun process startup.
- Endpoint tests use `@effect/vitest` and should exercise `ApiLive` through `HttpRouter.toWebHandler` instead of starting a port.
- Start with `bun run dev --filter=@repo/api` from the repository root or `bun run dev` inside `apps/api`.
- Effect language-service is configured in `tsconfig.json`; editors must use the workspace TypeScript version for the plugin to load.

## Verification

- `bun run lint`
- `bun run check-types`
- `bun run test`
- Smoke test with a free port when `5000` is already in use: `PORT=58321 bun run start`, then request `/health`, `/openapi.json`, and `/docs`.

## Child DOX Index

_none_
