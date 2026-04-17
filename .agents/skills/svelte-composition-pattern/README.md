# Svelte Composition Pattern

Build parts, not prop soup.

This skill teaches scalable composition patterns for headless Svelte
components. It is aimed at component APIs that are drifting toward boolean
flags, render-mode props, or prop-drilled state, and it pushes them back
toward explicit part families, typed context, snippet escape hatches, and
modern Svelte 5 APIs.

Focused on reusable shape over framework ceremony.

## Install

```bash
npx skills add Oungseik/svelte-composition-pattern
```

Install globally instead of per-project:

```bash
npx skills add Oungseik/svelte-composition-pattern -g
```

## When to Use

Use this skill when:

- a component is growing boolean mode props or render flags
- an API wants `Root`, `Trigger`, `Content`, `Item`, `Label` style parts
- sibling parts need shared state without prop drilling
- callers need custom markup without losing behavior
- older slot, action, or event-dispatch patterns need a Svelte 5 upgrade

## What It Pushes Toward

- Export explicit part families instead of stacking configuration props
- Keep shared state in the root and expose it through typed context
- Use snippets for escape hatches instead of mode props
- Merge caller props with internal behavior instead of clobbering either side
- Prefer modern Svelte 5 primitives unless the repo already has strong house
  helpers

## Structure

- `SKILL.md` - entry point, activation guidance, and rule map
- `rules/` - focused guidance for each pattern
- `references/composition-pattern-checkpoints.md` - compact repo-local pattern
  checkpoints
- `references/svelte-5-api-checkpoints.md` - Svelte 5 API checkpoints used by
  the skill

## Rule Map

### Architecture

- `architecture-export-part-families` - export namespace part families
- `architecture-avoid-mode-props` - replace boolean modes with explicit parts
  or discriminated unions

### State Ownership

- `state-root-owns-context` - root owns state, parts read typed context

### Composition Surface

- `patterns-snippet-surfaces` - use `children`, `child`, snippet props, and
  `{@render}`
- `patterns-merge-user-props` - merge internal behavior with caller props

### Modern Svelte APIs

- `svelte5-modern-apis` - use runes, `createContext`, snippets, attachments,
  callback props, and current async rules

## Core Principles

1. Split large APIs into part families.
2. Let the root own shared state.
3. Prefer composition over mode props.
4. Expose customization through snippets.
5. Keep repo house style when it already exists.

## Example Prompts

- "Refactor this headless Svelte component from prop soup into `Root`,
  `Trigger`, and `Content` parts."
- "Replace these render flags with snippet-based composition surfaces."
- "Move shared state into typed root context so sibling parts stop prop
  drilling."
- "Upgrade this Svelte 4 slot and action pattern to modern Svelte 5 APIs."

## Notes

The skill is pattern-first, not tied to one exact helper stack. If a codebase
already uses helpers like `runed` `Context` or
`svelte-toolbelt` `mergeProps`, keep the house style. If not, default to the
platform Svelte 5 APIs.
