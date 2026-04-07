<script lang="ts">
  import { useAiChat } from "./ai-chat.svelte.js";
  import type { AiChatRootProps } from "./types.js";

  let { api, onToolResult, children }: AiChatRootProps = $props();

  useAiChat({
    get api() {
      return api;
    },
    get onToolResult() {
      return onToolResult;
    },
  });
</script>

{@render children()}
