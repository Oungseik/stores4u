# Svelte 5 API Checkpoints

Checked against official Svelte docs on 2026-04-17.

## Current Calls

- `createContext` available since `5.40.0`
  Use it over raw `setContext` / `getContext` for typed context.
  Source: https://svelte.dev/docs/svelte/svelte

- `{@attach ...}` available in `5.29+`
  Docs say prefer attachments over `use:` when possible because more flexible,
  more composable.
  Sources:
  https://svelte.dev/docs/svelte/%40attach
  https://svelte.dev/docs/svelte/use

- `await` inside component script, `$derived`, and markup available in `5.36+`
  Still behind `experimental.async`.
  Docs say flag removed in Svelte 6.
  Source: https://svelte.dev/docs/svelte/await-expressions

- snippets are current composition surface
  Pass snippets as props, render with `{@render ...}`.
  Slots deprecated in Svelte 5.
  Sources:
  https://svelte.dev/docs/svelte/snippet
  https://svelte.dev/docs/svelte/%40render

- callback props now preferred over `createEventDispatcher`
  Source: https://svelte.dev/docs/svelte/svelte

- use event attributes like `onclick={...}`
  Not `on:click={...}` for new code.
  Source: https://svelte.dev/docs/svelte/best-practices

## Practical Read

If codebase already has helper wrappers, fine. But new composition API should
still smell like modern Svelte:

- typed context
- snippets
- runes
- callback props
- attachments when element behavior needs composition
