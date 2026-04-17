---
title: Prefer Modern Svelte 5 APIs
impact: MEDIUM
impactDescription: keeps composition surfaces aligned with current Svelte
tags: svelte5, runes, api
---

## Prefer Modern Svelte 5 APIs

Composition skill should teach current Svelte, not legacy carry-over.

Default choices:

- runes mode
- `$props`, `$state`, `$derived`
- `createContext` for typed context
- `{#snippet ...}` and `{@render ...}` for composition
- callback props over `createEventDispatcher`
- `onclick={...}` over `on:click={...}`
- `{@attach ...}` when behavior belongs on element and repo on Svelte 5.29+

Async note:

- `await` inside component script, `$derived`, and markup available since Svelte
  5.36
- still needs `experimental.async` until Svelte 6

**Incorrect:**

```svelte
<script lang="ts">
	import { createEventDispatcher, getContext } from "svelte";

	export let open = false;

	const dispatch = createEventDispatcher<{ openChange: boolean }>();
	const popover = getContext("popover");
</script>

<slot />

<button on:click={() => dispatch("openChange", !open)}>Toggle</button>
```

**Correct:**

```svelte
<script lang="ts">
	import { createContext } from "svelte";

	class PopoverState {
		open = $state(false);
	}

	export const [getPopoverState, setPopoverState] = createContext<PopoverState>();

	let { children, onOpenChange } = $props<{
		children?: import("svelte").Snippet;
		onOpenChange?: (open: boolean) => void;
	}>();

	const popover = setPopoverState(new PopoverState());

	function toggle() {
		popover.open = !popover.open;
		onOpenChange?.(popover.open);
	}
</script>

<button onclick={toggle}>Toggle</button>
{@render children?.()}
```

Repo exception:

- If codebase already wraps context or prop merging, keep house style.
- But do not introduce new slots, `on:` events, or dispatch-heavy APIs without
  reason.

Official checkpoints:

- `createContext` available since 5.40.0
- attachments preferred over `use:` in 5.29+
- await expressions available in 5.36 with `experimental.async`

References:

- https://svelte.dev/docs/svelte/svelte
- https://svelte.dev/docs/svelte/%40attach
- https://svelte.dev/docs/svelte/await-expressions
- https://svelte.dev/docs/svelte/snippet
- https://svelte.dev/docs/svelte/best-practices
