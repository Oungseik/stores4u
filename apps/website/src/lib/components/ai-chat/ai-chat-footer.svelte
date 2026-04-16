<script lang="ts">
  import type { AiChatFooterProps } from "./types.js";

  let { text = "AI can make mistakes. Please verify important information.", class: className }:
    AiChatFooterProps = $props();
</script>

<p class={["text-muted-foreground mb-2 text-center text-xs", className]}>
  {text}
</p>
