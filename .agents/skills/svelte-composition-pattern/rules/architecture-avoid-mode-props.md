---
title: Avoid Mode Props
impact: HIGH
impactDescription: prevents variant explosion and confused state models
tags: composition, props, variants
---

## Avoid Mode Props

Boolean mode props rot fast. One flag maybe fine for real on/off behavior. Not
fine for structure, layout, or variant families.

Split structural variants into:

- explicit parts like `Content` and `ContentStatic`
- explicit sub-families like `Menu.Sub`
- discriminated unions like `type: "single" | "multiple"`

**Incorrect:**

```ts
type AccordionProps = {
	multiple?: boolean;
	staticContent?: boolean;
	withPortal?: boolean;
};
```

```svelte
<Accordion multiple staticContent withPortal />
```

**Correct:**

```ts
type AccordionRootSingleProps = {
	type: "single";
	value?: string;
	onValueChange?: (value: string) => void;
};

type AccordionRootMultipleProps = {
	type: "multiple";
	value?: string[];
	onValueChange?: (value: string[]) => void;
};

type AccordionRootProps = AccordionRootSingleProps | AccordionRootMultipleProps;
```

```svelte
<Accordion.Root type="single">
	<Accordion.Item value="a">
		<Accordion.Trigger>One</Accordion.Trigger>
		<Accordion.Content>Body</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>

<Popover.Root>
	<Popover.Trigger>Open</Popover.Trigger>
	<Popover.ContentStatic />
</Popover.Root>
```

Why:

- caller sees real choice, not magic flag math
- type system can enforce valid combinations
- docs easier
- implementation branches shrink

Bits UI proof:

- `packages/bits-ui/src/lib/bits/accordion/types.ts`
- `packages/bits-ui/src/lib/bits/popover/exports.ts`
- `packages/bits-ui/src/lib/bits/menu/exports.ts`
