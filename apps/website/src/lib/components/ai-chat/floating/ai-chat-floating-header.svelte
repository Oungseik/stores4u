<script lang="ts">
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";

  import type { AiChatFloatingHeaderProps } from "../types.js";
  import { useFloatingChild } from "./floating.svelte.js";

  let {
    title = "AI Assistant",
    subtitle = "How can I help?",
    class: className,
  }: AiChatFloatingHeaderProps = $props();

  const floating = useFloatingChild();
</script>

<div class={["flex items-center justify-between border-b px-4 py-3", className]}>
  <div class="flex items-center gap-2">
    <div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
      <MessageCircleIcon class="text-primary size-4" />
    </div>
    <div>
      <p class="text-sm font-medium">{title}</p>
      <p class="text-muted-foreground text-xs">{subtitle}</p>
    </div>
  </div>
  <Button variant="ghost" size="icon" class="size-8" onclick={() => floating.close()}>
    <XIcon class="size-4" />
  </Button>
</div>
