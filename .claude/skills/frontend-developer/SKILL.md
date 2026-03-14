---
name: frontend-developer
description: Design, implement, and refactor frontend pages and components in this monorepo, especially Svelte/SvelteKit UI built with @repo/ui, @tanstack/svelte-form, zod validation, @tanstack/svelte-query, and ORPC-backed data flows. Use when requests mention sign-in/sign-up pages, landing pages, frontend component refactors, shadcn-backed component work in projects with a components.json file, lucide icons, mock-data-first frontend work while backend APIs are not ready, or TanStack Query patterns such as infinite queries with ORPC. When shadcn/ui or shadcn-svelte conventions are relevant, coordinate with the shadcn skill for component selection and composition rules while preserving the install guardrails below.
---

# Frontend Developer

## Overview

Build production-ready frontend UI in this monorepo using the project's existing conventions.
Prioritize consistency with `@repo/ui` imports, TanStack form/query patterns, and absolute lucide icon imports.
When `components.json` is present or shadcn components are involved, let the `shadcn` skill own component discovery, docs lookup, and composition rules. This skill owns repo-specific frontend architecture, form/query patterns, and integration with the local monorepo.

## Workflow

1. Identify the task type: new page, existing component refactor, or UI-only mock integration.
2. Read existing nearby code before editing, especially:
- `apps/website/src/routes/(auth)/signup/+page.svelte`
- Related route/component files in the same feature area
3. Inventory the available UI surface before adding anything:
- Reuse existing `@repo/ui` components first.
- If `packages/ui/components.json` exists, use the `shadcn` skill's rules for component discovery, docs, and composition.
4. If the required shadcn component is missing, stop and request user installation commands instead of installing automatically.
5. Implement with `@tanstack/svelte-form` + `zod` for forms and `@tanstack/svelte-query` for async data.
6. If API is unavailable, implement with mock data behind clearly marked sections.
7. Preserve Svelte 5 rune-style patterns already used in the target area.

## Shadcn Coordination

- Treat `frontend-developer` and `shadcn` as complementary, not competing.
- Use `shadcn` for component selection, installed-component awareness, registry/docs lookup, and shadcn-specific composition/styling rules.
- Use this skill for repo-specific decisions: route structure, data flow, form/query wiring, `@repo/ui` imports, copy, and mock-data strategy.
- If guidance conflicts, prefer the stricter shadcn component rule for UI composition and the existing repo pattern for application structure.

## Monorepo Conventions

- Import UI components from `@repo/ui/<component>` and then named exports.
- Import lucide icons absolutely from `@lucide/svelte/icons/<icon-name>`.
- Keep backend concerns out of scope for frontend-only tasks; use mock data and clear TODO markers for API wiring.

## Install Missing Components

Do not install components directly from this skill.
Do not run `pnpm run shadcn`, `pnpm run shadcn-extras`, `pnpm dlx shadcn-svelte@latest add`, or registry installers unless the user explicitly asks for installation in the current turn.

If required components are missing, stop and ask the user to run the exact commands.
Provide a concrete command list such as:
- `pnpm run shadcn button card`
- `pnpm run shadcn-extras @ieedan/shadcn-svelte-extras/password`

Continue only after the user confirms installation is complete.

## Form and Data Patterns

- Use `createForm` from `@tanstack/svelte-form` for local form state and submit flow.
- Use `zod` validators on form fields, returning first message from parse errors.
- Use `createMutation`, `createInfiniteQuery`, and `useQueryClient` from `@tanstack/svelte-query`.
- Use ORPC option helpers directly inside query factories, including `orpc.<resource>.<procedure>.infiniteOptions(...)` for cursor-based pagination.
- Use derived values (`$derived`) to map and filter query data for UI state.

See [references/patterns.md](references/patterns.md) for canonical examples pulled from the signup route and the admin products infinite-query page.

## Implementation Guardrails

- Prefer editing existing feature structure over introducing a new pattern.
- Keep validation messages user-readable and consistent with existing UI copy.
- Keep loading/submitting states explicit (for example spinner icons like `loader-2`).
- Avoid speculative backend integration; ship frontend behavior with predictable mock data when needed.
- If a better UI would require a missing shadcn component, say so explicitly and surface the blocked install command rather than silently substituting an unrelated custom widget.

## Done Criteria

- Updated UI compiles with existing conventions in the touched area.
- Imports follow monorepo rules (`@repo/ui`, absolute lucide paths).
- Form/query logic uses TanStack + zod patterns from this codebase.
- Missing component dependencies are surfaced to the user with explicit install commands instead of auto-installing.
- Any temporary mock wiring is clearly identified for future API replacement.
