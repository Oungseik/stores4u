<script lang="ts">
  import FloatingContainer from "./floating/ai-chat-floating-container.svelte";
  import FloatingHeader from "./floating/ai-chat-floating-header.svelte";
  import FloatingToggle from "./floating/ai-chat-floating-toggle.svelte";
  import Input from "./ai-chat-input.svelte";
  import Messages from "./ai-chat-messages.svelte";
  import Root from "./ai-chat.svelte";
  import SendButton from "./ai-chat-send-button.svelte";
  import { useFloatingState } from "./floating/floating.svelte.js";
  import type { AiChatWidgetProps } from "./types.js";

  useFloatingState();

  let {
    api,
    title = "AI Assistant",
    subtitle = "How can I help?",
    placeholder = "Type a message...",
    onToolResult,
    children,
  }: AiChatWidgetProps = $props();
</script>

<Root {api} {onToolResult}>
  <div class="fixed right-6 bottom-6 z-50 flex flex-col items-start gap-3">
    <FloatingContainer>
      <FloatingHeader {title} {subtitle} />
      <Messages />
      <Input {placeholder}>
        {#if children}
          {@render children()}
        {/if}
        <SendButton />
      </Input>
    </FloatingContainer>
    <FloatingToggle />
  </div>
</Root>
