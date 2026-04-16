<script lang="ts">
  import SendIcon from "@lucide/svelte/icons/send";
  import SquareIcon from "@lucide/svelte/icons/square";
  import { Button } from "@repo/ui/button";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatSendButtonProps } from "./types.js";

  let { class: className, children }: AiChatSendButtonProps = $props();

  const ctx = useAiChatChild();
</script>

{#if ctx.isChatBusy}
  <Button type="button" size="icon" class={["shrink-0", className]} onclick={() => ctx.stop()}>
    <SquareIcon class="size-4" />
  </Button>
{:else}
  <Button
    type="submit"
    size="icon"
    class={["shrink-0", className]}
    disabled={!ctx.inputText.trim()}
  >
    {#if children}
      {@render children()}
    {:else}
      <SendIcon class="size-4" />
    {/if}
  </Button>
{/if}
