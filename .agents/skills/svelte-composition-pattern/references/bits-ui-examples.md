# Bits UI Examples

Use this file when you want repo proof, not theory.

## Strong Examples

- `packages/bits-ui/src/lib/bits/popover/index.ts`
  `export * as Popover` namespace family. Clean surface.

- `packages/bits-ui/src/lib/bits/popover/exports.ts`
  Real part list: `Root`, `Trigger`, `Content`, `ContentStatic`, `Arrow`,
  `Close`, `Portal`.

- `packages/bits-ui/src/lib/bits/popover/components/popover.svelte`
  Root owns shared state setup. Renders `children`. No prop tunnel.

- `packages/bits-ui/src/lib/bits/popover/popover.svelte.ts`
  Shared behavior lives in state classes and typed context, not random leaf
  props.

- `packages/bits-ui/src/lib/bits/popover/components/popover-trigger.svelte`
  Default button branch plus `child` snippet escape hatch. Internal props merged
  once, then reused.

- `packages/bits-ui/src/lib/bits/popover/components/popover-content.svelte`
  Complex wrapper case. Exposes `wrapperProps`, merged content props, snippet
  props. Good model for floating layers.

- `packages/bits-ui/src/lib/bits/separator/components/separator.svelte`
  Smallest possible `child` + `children` pattern. Good starter template.

- `packages/bits-ui/src/lib/bits/dialog/components/dialog-content.svelte`
  Behavior layers wrap content. Caller still can replace element via `child`.

- `packages/bits-ui/src/lib/bits/tooltip/components/tooltip-content.svelte`
  Same pattern with floating wrapper and style merge. Good consistency proof.

- `packages/bits-ui/src/lib/bits/accordion/types.ts`
  Discriminated union for `type: "single" | "multiple"`. Better than
  `multiple?: boolean`.

- `packages/bits-ui/src/lib/bits/menu/exports.ts`
  Explicit sub-family parts like `Sub`, `SubTrigger`, `SubContent`.

- `packages/bits-ui/src/lib/internal/types.ts`
  Reusable `WithChild`, `WithChildren`, `WithChildNoChildrenSnippetProps`.
  Good library-level typing pattern.

- `packages/bits-ui/src/lib/shared/attributes.ts`
  Primitive HTML attribute base types. Helps build part props cleanly.

## What To Steal

- explicit parts
- typed context
- `.svelte.ts` behavior objects for heavy logic
- snippet escape hatches
- merged props passed to both default and custom branches
- explicit variants, not boolean soup
