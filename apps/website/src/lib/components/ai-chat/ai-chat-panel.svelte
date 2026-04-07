<script lang="ts">
  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatPanelProps } from "./types.js";

  let { ref = $bindable(null), class: className, children }: AiChatPanelProps = $props();

  const ctx = useAiChatChild();
</script>

{#if ctx.isOpen}
  <div
    bind:this={ref}
    data-slot="ai-chat-panel"
    class={[
      "bg-background flex h-150 w-80 flex-col rounded-2xl border shadow-2xl sm:w-95",
      className,
    ]}
  >
    {@render children()}
  </div>
{/if}
