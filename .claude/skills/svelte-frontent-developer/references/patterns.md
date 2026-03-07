# Svelte Frontend Patterns

Use this file as the baseline for implementation style in this repo.

## Canonical Source

- `apps/website/src/routes/(auth)/signup/+page.svelte`

## Imports

- Import UI components from `@repo/ui`:
  - `import { Button } from "@repo/ui/button";`
  - `import * as Card from "@repo/ui/card";`
- Import lucide icons with absolute icon paths:
  - `import Loader2Icon from "@lucide/svelte/icons/loader-2";`
- Keep local app imports under `$lib/*` and `$app/*`.

## Form Setup with TanStack + Zod

1. Create `defaultValues`.
2. Build form via `createForm(() => ({ defaultValues, onSubmit }))`.
3. Define field validators using zod parse results, usually:
   - `z.<schema>().safeParse(value).error?.issues.at(0)?.message`
4. Prevent native submit and call `form.handleSubmit()` manually in `onsubmit`.
5. Surface `field.state.meta.errors` in UI below the field.

## Query and Mutation Pattern

- Import from `@tanstack/svelte-query`:
  - `createInfiniteQuery`
  - `createMutation`
  - `useQueryClient`
- Build query options from API helpers, including `enabled`, paging, input mapper, and `getNextPageParam`.
- Derive transformed lists with `$derived(...)`.
- Create mutations with `createMutation(() => api.<feature>.mutationOptions())`.

## Mock-Data Rule

- If backend API is unavailable, implement the full UI behavior with mock data.
- Keep mock blocks isolated and easy to replace.
- Mark replacement points with concise TODO comments.
