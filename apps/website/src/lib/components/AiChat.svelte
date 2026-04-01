<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import SendIcon from "@lucide/svelte/icons/send";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { Textarea } from "@repo/ui/textarea";
  import { DefaultChatTransport, getToolName, isTextUIPart, isToolUIPart } from "ai";
  import { quintOut } from "svelte/easing";
  import { scale } from "svelte/transition";

  import type { ShopFormFields } from "$lib/types/shop-form";
  import { fillFormOutputSchema } from "$lib/types/shop-form";

  type OnFillForm = (fields: ShopFormFields) => void;

  interface Props {
    onFillForm: OnFillForm;
  }

  let { onFillForm }: Props = $props();

  let isOpen = $state(false);
  let inputText = $state("");
  let messagesContainer: HTMLDivElement | null = $state(null);
  let textareaRef: HTMLTextAreaElement | null = $state(null);

  const chat = new Chat({
    transport: new DefaultChatTransport({ api: "/api/ai/shop-setup" }),
    onFinish: ({ message }) => {
      for (const part of message.parts) {
        if (isToolUIPart(part) && getToolName(part) === "fillShopForm") {
          if (part.state === "output-available" && part.output) {
            const parsed = fillFormOutputSchema.safeParse(part.output);
            if (parsed.success && parsed.data.success) {
              onFillForm(parsed.data.fields);
            }
          }
        }
      }
    },
  });

  const isChatBusy = $derived(chat.status === "submitted" || chat.status === "streaming");

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) setTimeout(scrollToBottom, 100);
  }

  function handleSubmit(e?: Event) {
    e?.preventDefault();
    if (!inputText.trim() || isChatBusy) return;
    chat.sendMessage({ text: inputText.trim() });
    inputText = "";
    requestAnimationFrame(() => adjustTextareaHeight());
  }

  function adjustTextareaHeight() {
    if (textareaRef) {
      textareaRef.style.height = "auto";
      textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 120)}px`;
    }
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $effect(() => {
    chat.messages;
    chat.status;
    setTimeout(scrollToBottom, 50);
  });
</script>

{#snippet Generating()}
  <div class="mb-3 flex justify-start">
    <div class="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
      <span class="thinking-dots text-muted-foreground text-xs">
        <span class="dot">•</span><span class="dot">•</span><span class="dot">•</span>
      </span>
    </div>
  </div>
{/snippet}

<div class="fixed right-6 bottom-6 z-50 flex flex-col items-start gap-3">
  {#if isOpen}
    <div
      transition:scale={{ start: 0.9, duration: 200, easing: quintOut }}
      class="bg-background flex h-130 w-80 flex-col rounded-2xl border shadow-2xl sm:w-95"
    >
      <div class="flex items-center justify-between border-b px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
            <MessageCircleIcon class="text-primary size-4" />
          </div>
          <div>
            <p class="text-sm font-medium">AI Setup Assistant</p>
            <p class="text-muted-foreground text-xs">Helps you set up your store</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" class="size-8" onclick={toggleChat}>
          <XIcon class="size-4" />
        </Button>
      </div>

      <div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-4 py-3">
        {#if chat.messages.length === 0}
          <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div class="bg-primary/10 flex size-12 items-center justify-center rounded-full">
              <MessageCircleIcon class="text-primary size-6" />
            </div>
            <div>
              <p class="text-sm font-medium">Welcome!</p>
              <p class="text-muted-foreground mt-1 text-xs">
                I'll help you set up your store.<br />Tell me about your shop!
              </p>
            </div>
          </div>
        {:else}
          {#each chat.messages as message (message.id)}
            {#if message.role === "user"}
              <div class="mb-3 flex justify-end">
                <div
                  class="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm"
                >
                  {#each message.parts as part}
                    {#if isTextUIPart(part)}
                      {part.text}
                    {/if}
                  {/each}
                </div>
              </div>
            {:else if message.role === "assistant"}
              {@const textParts = message.parts.filter((p) => isTextUIPart(p))}
              {@const completedToolParts = message.parts.filter(
                (p) =>
                  isToolUIPart(p) &&
                  getToolName(p) === "fillShopForm" &&
                  p.state === "output-available"
              )}
              {#if textParts.length > 0}
                <div class="mb-3 flex justify-start">
                  <div class="bg-muted max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-3 text-sm">
                    {#each textParts as part}
                      {part.text}
                    {/each}
                  </div>
                </div>
              {:else}
                {@render Generating()}
              {/if}
              {#each completedToolParts as _part}
                <div class="mb-3 ml-1 flex items-center gap-1.5 text-green-600">
                  <svg
                    class="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span class="text-xs">Form filled! Review and submit when ready.</span>
                </div>
              {/each}
            {/if}
          {/each}

          {#if chat.status === "submitted"}
            {@render Generating()}
          {/if}
        {/if}
      </div>

      <form class="border-t p-3" onsubmit={handleSubmit}>
        <div class="flex items-end gap-2">
          <Textarea
            bind:value={inputText}
            bind:ref={textareaRef}
            placeholder="Tell me about your shop..."
            rows={1}
            class="bg-muted max-h-[120px] min-h-[40px] flex-1 resize-none border-0 px-3 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isChatBusy}
            onkeydown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            oninput={adjustTextareaHeight}
          />
          <Button
            type="submit"
            size="icon"
            class="shrink-0"
            disabled={isChatBusy || !inputText.trim()}
          >
            <SendIcon class="size-4" />
          </Button>
        </div>
      </form>
    </div>
  {/if}

  <Button
    onclick={toggleChat}
    size="icon-xs"
    class="bg-primary hover:bg-primary/90 ml-auto size-12 rounded-full shadow-lg"
  >
    {#if isOpen}
      <XIcon class="size-5" />
    {:else}
      <MessageCircleIcon class="size-5" />
    {/if}
  </Button>
</div>

<style>
  .thinking-dots .dot {
    display: inline-block;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .thinking-dots .dot:nth-child(1) {
    animation-delay: 0s;
  }

  .thinking-dots .dot:nth-child(2) {
    animation-delay: 0.16s;
  }

  .thinking-dots .dot:nth-child(3) {
    animation-delay: 0.32s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      opacity: 0.3;
    }
    40% {
      opacity: 1;
    }
  }
</style>
