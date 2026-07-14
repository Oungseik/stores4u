# packages/ui

## Purpose

Shared Svelte 5 UI component library (shadcn-svelte based) used by `apps/website`.

## Ownership

Owns: presentational and primitive components (button, card, sidebar, data-table, dialogs, forms, etc.) plus shared icons/styling tokens.

## Local Contracts

- Depends on `@repo/config` for enum-driven UI where needed.
- Components are framework-agnostic app UI; no store/auth/domain logic lives here.
- Exports a small `@repo/ui/hooks` surface (barrel `src/lib/hooks/index.ts` re-exporting `UseClipboard` / `copyText` from `use-clipboard.svelte.ts`) so consumers reuse the secure-context-aware clipboard instead of reinventing it.

## Work Guidance

- Add shadcn-svelte components via the root scripts (`shadcn`, `shadcn-extras`).

## Verification

- `bun run check-types` (root turbo task)

## Child DOX Index

_none_
