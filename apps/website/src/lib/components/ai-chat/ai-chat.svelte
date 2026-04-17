<script lang="ts">
  import { useAiChat } from "./ai-chat.svelte.js";
  import type { AiChatRootProps } from "./types.js";

  let {
    api,
    chatId,
    initialMessages,
    onSend,
    onFinish,
    onToolResult,
    maxFiles,
    children,
  }: AiChatRootProps = $props();

  useAiChat({
    get api() {
      return api;
    },
    get chatId() {
      return chatId;
    },
    get initialMessages() {
      return initialMessages;
    },
    get onSend() {
      return onSend;
    },
    get onFinish() {
      return onFinish;
    },
    get onToolResult() {
      return onToolResult;
    },
    get maxFiles() {
      return maxFiles;
    },
  });
</script>

{@render children()}
