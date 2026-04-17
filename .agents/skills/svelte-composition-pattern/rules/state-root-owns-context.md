---
title: Root Owns Shared Context
impact: HIGH
impactDescription: removes prop drilling and keeps part contracts stable
tags: composition, context, state
---

## Root Owns Shared Context

Root owns state. Parts read state. Do not tunnel state through props from
`Root -> List -> Item -> Trigger -> Icon`.

For new code, prefer `createContext`. If repo already uses typed helper like
`new Context<T>()`, keep house style. Goal same.

**Incorrect:**

```svelte
<!-- Root.svelte -->
<script lang="ts">
	let { open = $bindable(false), children } = $props();
</script>

{@render children?.({ open })}
```

```svelte
<!-- Trigger.svelte -->
<script lang="ts">
	let { open, setOpen } = $props();
</script>

<button
	aria-expanded={open}
	onclick={() => setOpen(!open)}
>
	{@render children?.()}
</button>
```

**Correct:**

```ts
// popover-context.svelte.ts
import { createContext } from "svelte";

export class PopoverState {
	open = $state(false);

	toggle = () => {
		this.open = !this.open;
	};
}

export const [getPopoverState, setPopoverState] = createContext<PopoverState>();
```

```svelte
<!-- popover.svelte -->
<script lang="ts">
	import { PopoverState, setPopoverState } from "./popover-context.svelte.js";

	let { children } = $props();

	setPopoverState(new PopoverState());
</script>

{@render children?.()}
```

```svelte
<!-- popover-trigger.svelte -->
<script lang="ts">
	import { getPopoverState } from "./popover-context.svelte.js";

	let { children } = $props();

	const popover = getPopoverState();
</script>

<button
	aria-expanded={popover.open}
	onclick={popover.toggle}
>
	{@render children?.()}
</button>
```

Extra rule:

- behavior classes or `.svelte.ts` helpers good for headless libraries
- leaf parts should ask context for what they need
- parent should not orchestrate every child manually

Review checks:

- root creates shared state and sets context once
- parts read context directly instead of accepting tunneled state props
- shared behavior can move into `.svelte.ts` helpers when leaf components get noisy
