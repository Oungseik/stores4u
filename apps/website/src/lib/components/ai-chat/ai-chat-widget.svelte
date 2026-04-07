<script lang="ts">
  import Header from "./ai-chat-header.svelte";
  import Input from "./ai-chat-input.svelte";
  import Messages from "./ai-chat-messages.svelte";
  import Panel from "./ai-chat-panel.svelte";
  import Toggle from "./ai-chat-toggle.svelte";
  import { useAiChat } from "./ai-chat.svelte.js";
  import type { AiChatWidgetProps } from "./types.js";

  let {
    api,
    title = "AI Assistant",
    subtitle = "How can I help?",
    placeholder = "Type a message...",
    onToolResult,
    children,
  }: AiChatWidgetProps = $props();

  useAiChat({
    get api() {
      return api;
    },
    get onToolResult() {
      return onToolResult;
    },
  });
</script>

<div class="fixed right-6 bottom-6 z-50 flex flex-col items-start gap-3">
  <Panel>
    <Header {title} {subtitle} />
    <Messages />
    <Input {placeholder}>
      {#if children}
        {@render children()}
      {/if}
    </Input>
  </Panel>
  <Toggle />
</div>
