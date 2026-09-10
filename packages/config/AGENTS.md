# packages/config

## Purpose

Shared configuration: country/currency enums and domain constants.

## Ownership

Owns: `COUNTRIES`, `CURRENCIES`, `LANGUAGES`, `DEFAULT_LANGUAGE`, `TIMEZONES`, `DEFAULT_TIMEZONE`, `isValidTimezone`, and the `lowStockThreshold` default.

## Local Contracts

- Consumed by `@repo/ui`, `@repo/database`, and `apps/website` (schema enums, form options, UI badges). `LANGUAGES` is the closed `en` / `my` user-UI set with English fallback; `TIMEZONES` feeds the store-timezone pickers in `/setup` and Settings → Business (UI only — see validation note).
- Pure data, no runtime side effects. `TIMEZONES` is derived once at module load from `Intl.supportedValuesOf("timeZone")` (full IANA list; `readonly string[]`, not a `as const` tuple).
- **Timezone validation**: do NOT use `TIMEZONES` as a server-side `z.enum` — `Intl.supportedValuesOf` is runtime-ICU-specific (some builds return obsolete names like `Asia/Calcutta`/`Africa/Asmera` and omit `Asia/Yangon`), so it rejects valid tz strings chosen by the browser. Validate with `isValidTimezone` (`z.string().refine(isValidTimezone)`) instead — it constructs `Intl.DateTimeFormat({ timeZone })`, accepting any tz the runtime's formatter understands. This is what `/setup` and shop-update handlers use.

## Work Guidance

- Keep enums as `as const` tuples with derived types. Exception: `TIMEZONES` is a runtime `Intl.supportedValuesOf` result (UI dropdown source only); validate timezone strings with `isValidTimezone`, never via `z.enum(TIMEZONES)`.

## Verification

- `bun run typecheck` (root turbo → `tsc --noEmit` with stable TypeScript 7)

## Child DOX Index

_none_
