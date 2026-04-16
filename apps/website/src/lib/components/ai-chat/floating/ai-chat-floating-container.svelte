<script lang="ts">
  import { tick } from "svelte";

  import { useAiChatChild } from "../ai-chat.svelte.js";
  import type { AiChatFloatingContainerProps } from "../types.js";
  import { useFloatingChild } from "./floating.svelte.js";

  let { class: className, children }: AiChatFloatingContainerProps = $props();

  const ctx = useAiChatChild();
  const floating = useFloatingChild();

  $effect.pre(() => {
    floating.isOpen;
    if (floating.isOpen) {
      tick().then(() => ctx.scrollToBottom());
    }
  });
</script>

{#if floating.isOpen}
  <div
    data-slot="ai-chat-floating-container"
    class={[
      "bg-background fixed right-6 bottom-6 z-50 flex h-150 w-80 flex-col rounded-2xl border shadow-2xl sm:w-95",
      className,
    ]}
  >
    {@render children()}
  </div>
{/if}
