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

Bits UI proof:

- `packages/bits-ui/src/lib/bits/popover/index.ts`
- `packages/bits-ui/src/lib/bits/popover/exports.ts`
- `packages/bits-ui/src/lib/bits/dialog/exports.ts`
- `packages/bits-ui/src/lib/bits/menu/exports.ts`
