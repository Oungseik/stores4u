<script lang="ts">
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatToggleProps } from "./types.js";

  let { class: className }: AiChatToggleProps = $props();

  const ctx = useAiChatChild();
</script>

<Button
  onclick={() => ctx.toggleChat()}
  size="icon-xs"
  class={["bg-primary hover:bg-primary/90 ml-auto size-12 rounded-full shadow-lg", className]}
>
  {#if ctx.isOpen}
    <XIcon class="size-5" />
  {:else}
    <MessageCircleIcon class="size-5" />
  {/if}
</Button>
