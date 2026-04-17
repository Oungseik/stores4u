---
name: svelte-composition-pattern
description:
  Svelte composition patterns for scalable component APIs. Use when building or
  refactoring headless Svelte components, compound component families,
  snippet-driven APIs, typed context flows, or when boolean props and render
  flags start spreading. Grounded in Bits UI patterns and modern Svelte 5 APIs.
---

# Svelte Composition Pattern

Build parts, not prop soup.

Use this skill when:

- component grows mode booleans or render flags
- API wants `Root`, `Trigger`, `Content`, `Item`, `Label` style parts
- state must be shared across sibling parts without prop drilling
- caller needs custom markup without losing behavior
- old slots, actions, or event-dispatch patterns need Svelte 5 upgrade

## Priority

| Priority | Category | Impact | Prefix |
| --- | --- | --- | --- |
| 1 | Architecture | HIGH | `architecture-` |
| 2 | State Ownership | HIGH | `state-` |
| 3 | Composition Surface | HIGH | `patterns-` |
| 4 | Modern Svelte APIs | MEDIUM | `svelte5-` |

## Quick Start

1. Find prop soup.
2. Split API into part family.
3. Put shared state in root context.
4. Expose escape hatches with snippets, not mode props.
5. Merge caller props with internal behavior.
6. Use modern Svelte 5 APIs unless repo house style says otherwise.

## Rule Map

### 1. Architecture

- `architecture-export-part-families` - export namespace part families like Bits UI
- `architecture-avoid-mode-props` - replace boolean modes with explicit parts or discriminated unions

### 2. State Ownership

- `state-root-owns-context` - root owns state, parts read typed context

### 3. Composition Surface

- `patterns-snippet-surfaces` - use `children`, `child`, snippet props, `{@render}`
- `patterns-merge-user-props` - merge internal behavior with caller props, do not clobber

### 4. Modern Svelte APIs

- `svelte5-modern-apis` - use runes, `createContext`, snippets, attachments, callback props, async rules

## Repo Proof

For concrete Bits UI examples, read `references/bits-ui-examples.md`.

For latest Svelte API checkpoints bundled into this skill, read
`references/svelte-5-api-checkpoints.md`.

## House Style Note

Bits UI sometimes uses helpers like `runed` `Context` and `svelte-toolbelt`
`mergeProps`. That fine. Shape matters more than exact helper:

- typed context
- root-owned state
- part family exports
- snippet escape hatches
- explicit variants

If repo already has helper, keep house style. If not, default to platform
Svelte 5 APIs.
