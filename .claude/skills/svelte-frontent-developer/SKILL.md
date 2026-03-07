---
name: svelte-frontent-developer
description: Design, implement, and refactor Svelte frontend pages and components in this monorepo with @repo/ui, @tanstack/svelte-form, zod validation, and @tanstack/svelte-query data flows. Use when requests mention sign-in/sign-up pages, landing pages, component UI refactors (for example forms like AddProductForm.svelte), shadcn component installation, lucide icons, or mock-data-first frontend work while backend APIs are not ready.
---

# Svelte Frontent Developer

## Overview

Build production-ready Svelte UI in this monorepo using the project's existing conventions.
Prioritize consistency with `@repo/ui` imports, TanStack form/query patterns, and absolute lucide icon imports.

## Workflow

1. Identify the task type: new page, existing component refactor, or UI-only mock integration.
2. Read existing nearby code before editing, especially:
- `apps/website/src/routes/(auth)/signup/+page.svelte`
- Related route/component files in the same feature area
3. Reuse existing `@repo/ui` components first; if missing shadcn components are required, stop and request user installation commands.
4. Implement with `@tanstack/svelte-form` + `zod` for forms and `@tanstack/svelte-query` for async data.
5. If API is unavailable, implement with mock data behind clearly marked sections.
6. Preserve Svelte 5 rune-style patterns already used in the target area.

## Monorepo Conventions

- Import UI components from `@repo/ui/<component>` and then named exports.
- Import lucide icons absolutely from `@lucide/svelte/icons/<icon-name>`.
- Keep backend concerns out of scope for frontend-only tasks; use mock data and clear TODO markers for API wiring.

## Install Missing Components

Do not install components directly from this skill.

If required components are missing, stop and ask the user to run the exact commands.
Provide a concrete command list such as:
- `pnpm run shadcn button card`
- `pnpm run shadcn-extras @ieedan/shadcn-svelte-extras/password`

Continue only after the user confirms installation is complete.

## Form and Data Patterns

- Use `createForm` from `@tanstack/svelte-form` for local form state and submit flow.
- Use `zod` validators on form fields, returning first message from parse errors.
- Use `createMutation`, `createInfiniteQuery`, and `useQueryClient` from `@tanstack/svelte-query`.
- Use derived values (`$derived`) to map and filter query data for UI state.

See [references/patterns.md](references/patterns.md) for canonical examples pulled from the signup route.

## Implementation Guardrails

- Prefer editing existing feature structure over introducing a new pattern.
- Keep validation messages user-readable and consistent with existing UI copy.
- Keep loading/submitting states explicit (for example spinner icons like `loader-2`).
- Avoid speculative backend integration; ship frontend behavior with predictable mock data when needed.

## Done Criteria

- Updated UI compiles with existing conventions in the touched area.
- Imports follow monorepo rules (`@repo/ui`, absolute lucide paths).
- Form/query logic uses TanStack + zod patterns from this codebase.
- Missing component dependencies are surfaced to the user with explicit install commands instead of auto-installing.
- Any temporary mock wiring is clearly identified for future API replacement.
