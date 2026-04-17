<script lang="ts">
  import XIcon from "@lucide/svelte/icons/x";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatAttachmentsPreviewProps } from "./types.js";

  let { class: className }: AiChatAttachmentsPreviewProps = $props();

  const ctx = useAiChatChild();
</script>

{#if ctx.pendingPreviewUrls.length > 0}
  <div class={`flex gap-1.5 overflow-x-auto px-3 pb-2 ${className ?? ""}`}>
    {#each ctx.pendingPreviewUrls as previewUrl, i}
      <div class="bg-muted group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
        <img
          src={previewUrl}
          alt={ctx.pendingFiles[i]?.name ?? "Attached image"}
          class="h-full w-full object-cover"
        />
        <button
          type="button"
          class="bg-background/80 hover:bg-background absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full transition-opacity"
          onclick={() => ctx.removeFile(i)}
        >
          <XIcon class="size-3" />
        </button>
      </div>
    {/each}
  </div>
{/if}
