---
title: Export Part Families
impact: HIGH
impactDescription: keeps API explicit and kills prop soup early
tags: composition, compound-components, exports
---

## Export Part Families

Do not ship one god component with structural flags. Ship part family.

Bad shape:

- `Popover` with `static`, `hasArrow`, `portal`, `asChild`, `showClose`
- caller learn flags, not structure

**Incorrect:**

```svelte
<!-- one component, too many structural switches -->
<Popover
	static
	portal
	showArrow
	triggerAsChild
	contentAsChild
/>
```

**Correct:**

```ts
// index.ts
export * as Popover from "./exports.js";
```

```ts
// exports.ts
export { default as Root } from "./components/popover.svelte";
export { default as Trigger } from "./components/popover-trigger.svelte";
export { default as Content } from "./components/popover-content.svelte";
export { default as ContentStatic } from "./components/popover-content-static.svelte";
export { default as Arrow } from "./components/popover-arrow.svelte";
export { default as Close } from "./components/popover-close.svelte";
export { default as Portal } from "./components/portal.svelte";
```

```svelte
<Popover.Root bind:open>
	<Popover.Trigger>Open</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content>
			<Popover.Arrow />
			<Popover.Close />
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
```

Why:

- structure visible in markup
- each part small, testable, replaceable
- variants become composition choices, not flag matrix

Review checks:

- exported names describe structure, not toggles
- namespace family stays shallow: `Root`, `Trigger`, `Content`, not nested flag bags
- adding a new structural option should mean adding a part or sub-family, not another boolean
