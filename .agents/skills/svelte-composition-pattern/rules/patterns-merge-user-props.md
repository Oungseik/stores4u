---
title: Merge Caller Props With Internal Behavior
impact: HIGH
impactDescription: keeps headless parts customizable without losing a11y and events
tags: composition, props, headless-ui
---

## Merge Caller Props With Internal Behavior

Headless parts must not force caller into default tag forever. But they also
must not drop internal ids, aria attrs, refs, events, or styles.

Merge. Then pass merged props into default element or `child` snippet.

**Incorrect:**

```svelte
<script lang="ts">
	let { child, ...restProps } = $props();

	const triggerProps = {
		id: "trigger",
		"aria-expanded": true,
		onclick: () => console.log("toggle")
	};
</script>

{#if child}
	{@render child({ props: restProps })}
{:else}
	<button {...triggerProps} {...restProps} />
{/if}
```

Bad:

- `child` misses internal behavior
- spreads can clobber handlers or attrs by accident

**Correct:**

```svelte
<script lang="ts">
	import { mergeProps } from "svelte-toolbelt";

	let { child, children, ...restProps } = $props();

	const triggerProps = {
		id: "trigger",
		"aria-expanded": true,
		onclick: () => console.log("toggle")
	};

	const mergedProps = $derived(mergeProps(restProps, triggerProps, { type: "button" }));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<button {...mergedProps}>
		{@render children?.()}
	</button>
{/if}
```

Rule of thumb:

- merge before render
- give `child` exact same merged behavior as default branch
- if wrapper element needed, expose `wrapperProps` too

Review checks:

- `child` receives the same merged props as the default branch
- internal ids, aria attrs, refs, handlers, and classes survive customization
- wrapper layers expose separate props when callers need to replace nested elements
