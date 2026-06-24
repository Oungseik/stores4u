# @repo/ui

Shared Svelte 5 UI components for the Stores4U website.

This package owns presentational components, primitive wrappers, styles, and UI helpers. Store, auth, and database logic belongs in `apps/website` or domain packages, not here.

## Exports

- `@repo/ui/<component>` for shadcn-style UI components such as `button`, `card`, `sidebar`, `data-table`, and dialogs.
- `@repo/ui/ai-elements/*` for AI chat UI pieces.
- `@repo/ui/prompt-kit/*` for prompt-kit components.
- `@repo/ui/css` for the shared CSS entry.
- `@repo/ui/styles/*` for shared style files.

## Add Components

Run from the repository root:

```bash
bun run shadcn <component-name>
bun run shadcn-extras <component-name>
```

The package-level `components.json` points shadcn-svelte at `src/lib/components`, `src/lib/hooks`, and `src/lib/utils`.

## Checks

```bash
bun run check-types
```
