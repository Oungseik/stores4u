<script lang="ts">
  import ImageIcon from "@lucide/svelte/icons/image";
  import * as FileDropZone from "@repo/ui/file-drop-zone";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatAttachButtonProps } from "./types.js";

  let { class: className }: AiChatAttachButtonProps = $props();

  const ctx = useAiChatChild();
</script>

<FileDropZone.Trigger class={`shrink-0 ${className ?? ""}`}>
  <span
    class="hover:bg-accent inline-flex size-8 items-center justify-center rounded-md transition-colors"
  >
    <span class="relative">
      <ImageIcon class="text-muted-foreground size-4" />
      {#if ctx.pendingFiles.length > 0}
        <span
          class="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium"
        >
          {ctx.pendingFiles.length}
        </span>
      {/if}
    </span>
  </span>
</FileDropZone.Trigger>
