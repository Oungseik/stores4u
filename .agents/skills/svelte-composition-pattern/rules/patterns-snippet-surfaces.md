---
title: Use Snippet Surfaces
impact: HIGH
impactDescription: gives callers markup control without breaking behavior
tags: composition, snippets, children
---

## Use Snippet Surfaces

In Svelte 5, snippets beat slots for composition. Use:

- `children` for normal composed content
- `child` when caller must own rendered element
- typed snippet props when caller needs state like `open`, `wrapperProps`, `selected`

Do not add render flags like `renderLabel`, `renderIcon`, `renderTrigger`.

**Incorrect:**

```svelte
<script lang="ts">
	let {
		renderTrigger,
		renderContent,
		showIcon = false,
		open = false
	} = $props();
</script>

{#if renderTrigger}
	{@render renderTrigger()}
{:else}
	<button>Open</button>
{/if}

{#if renderContent}
	{@render renderContent({ open })}
{/if}
```

**Correct:**

```svelte
<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = {
		child?: Snippet<[{
			props: Record<string, unknown>;
			open: boolean;
		}]>;
		children?: Snippet;
	};

	let { child, children, ...props }: Props = $props();

	let open = $state(false);
</script>

{#if child}
	{@render child({ props, open })}
{:else}
	<button
		{...props}
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		{@render children?.()}
	</button>
{/if}
```

Use snippet props for stateful escape hatches:

```svelte
{@render child({ props: mergedProps, wrapperProps, open })}
```

Why:

- caller can replace element, keep behavior
- no legacy slot API
- stateful customization stays typed

Review checks:

- `children` handles normal composition and `child` owns element replacement
- snippet props carry typed state such as `open`, `selected`, or merged props
- render flags like `renderTrigger` or `renderIcon` disappear from the API
