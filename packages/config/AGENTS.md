# packages/config

## Purpose

Shared configuration: country/currency enums, social-platform metadata, and domain constants.

## Ownership

Owns: `COUNTRIES`, `CURRENCIES`, `SOCIAL_PLATFORMS`, `PLATFORM_CONFIG`, and the `lowStockThreshold` default.

## Local Contracts

- Consumed by `@repo/ui` and `apps/website` (schema enums, form options, UI badges).
- Pure data, no runtime side effects.

## Work Guidance

- Keep enums as `as const` tuples with derived types.

## Verification

- `bun run typecheck` (root turbo → `tsgo --noEmit` here via `@typescript/native-preview`)

## Child DOX Index

_none_
