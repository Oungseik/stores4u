# Frontend Patterns

Use this file as the baseline for implementation style in this repo.

## Canonical Source

- `apps/website/src/routes/(auth)/signup/+page.svelte`
- `apps/website/src/routes/(protected)/admin/[slug]/+page.svelte`

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

## Infinite Query with ORPC

Use this pattern when the backend exposes an ORPC cursor-paginated endpoint and the UI needs a "Load more" flow.

```ts
import { createInfiniteQuery } from "@tanstack/svelte-query";

import { orpc } from "$lib/orpc_client";

const products = createInfiniteQuery(() =>
  orpc.products.list.infiniteOptions({
    initialPageParam: undefined as string | undefined,
    input: (cursor) => ({
      pageSize: 20,
      cursor,
      slug: params.slug,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!params.slug,
  })
);

const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);
```

Follow these rules:

- Call `createInfiniteQuery(() => ...)` and return `orpc.<resource>.<procedure>.infiniteOptions(...)` directly from the factory.
- Set `initialPageParam` to the cursor type used by the procedure. In this repo that is often `undefined as string | undefined`.
- Pass `input` as a function of `cursor`, then merge the cursor with stable filters like `slug` and `pageSize`.
- Read the next cursor from the server response in `getNextPageParam`.
- Gate the query with `enabled` when route params or other required inputs may be unavailable on first render.
- Flatten pages with `$derived(query.data?.pages.flatMap(... ) ?? [])` before rendering lists.
- Use `query.hasNextPage` and `query.fetchNextPage()` for the "Load More" action, and `query.isFetchingNextPage` for button loading state.

This pattern matches:
- `apps/website/src/routes/(protected)/admin/[slug]/+page.svelte`

## Mock-Data Rule

- If backend API is unavailable, implement the full UI behavior with mock data.
- Keep mock blocks isolated and easy to replace.
- Mark replacement points with concise TODO comments.
