<script lang="ts">
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";

  import type { AiChatFloatingToggleProps } from "../types.js";
  import { useFloatingChild } from "./floating.svelte.js";

  let { class: className }: AiChatFloatingToggleProps = $props();

  const floating = useFloatingChild();
</script>

<Button
  onclick={() => floating.toggle()}
  size="icon-xs"
  class={["bg-primary hover:bg-primary/90 ml-auto size-12 rounded-full shadow-lg", className]}
>
  {#if floating.isOpen}
    <XIcon class="size-5" />
  {:else}
    <MessageCircleIcon class="size-5" />
  {/if}
</Button>
