# packages/config

## Purpose

Shared configuration: country/currency enums and domain constants.

## Ownership

Owns: `COUNTRIES`, `CURRENCIES`, `TIMEZONES`, `DEFAULT_TIMEZONE`, and the `lowStockThreshold` default.

## Local Contracts

- Consumed by `@repo/ui` and `apps/website` (schema enums, form options, UI badges). `TIMEZONES` feeds the store-timezone pickers in `/setup` and Settings → Business.
- Pure data, no runtime side effects. `TIMEZONES` is derived once at module load from `Intl.supportedValuesOf("timeZone")` (full IANA list; `readonly string[]`, not a `as const` tuple).

## Work Guidance

- Keep enums as `as const` tuples with derived types. Exception: `TIMEZONES` is a runtime `Intl.supportedValuesOf` result, cast to a zod tuple at use sites.

## Verification

- `bun run typecheck` (root turbo → `tsgo --noEmit` here via `@typescript/native-preview`)

## Child DOX Index

_none_
