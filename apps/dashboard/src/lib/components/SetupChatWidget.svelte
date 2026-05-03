<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Message from "@repo/ui/ai-elements/message";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";
  import * as Reasoning from "@repo/ui/ai-elements/reasoning";
  import * as Tool from "@repo/ui/ai-elements/tool";
  import { Button } from "@repo/ui/button";
  import { Loader } from "@repo/ui/prompt-kit/loader";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import {
    DefaultChatTransport,
    getToolName,
    isReasoningUIPart,
    isTextUIPart,
    isToolUIPart,
  } from "ai";
  import { tick } from "svelte";

  import { type ShopFormFields, fillFormOutputSchema } from "$lib/types/shop";

  let { onFill }: { onFill: (fields: ShopFormFields) => void } = $props();

  let isChatOpen = $state(false);
  let messagesContainer: HTMLDivElement | null = $state(null);
  let textareaRef: HTMLTextAreaElement | null = $state(null);

  const chat = new Chat({
    transport: new DefaultChatTransport({ api: "/api/v1/chat" }),
    onFinish: ({ message }) => {
      for (const part of message.parts) {
        if (isToolUIPart(part) && part.state === "output-available" && part.output) {
          if (getToolName(part) === "fillShopForm") {
            const parsed = fillFormOutputSchema.safeParse(part.output);
            if (parsed.success && parsed.data.success) {
              onFill(parsed.data.fields);
            }
          }
        }
      }
    },
  });

  function isNearBottom(): boolean {
    if (!messagesContainer) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    return scrollHeight - scrollTop - clientHeight < 250;
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $effect(() => {
    const container = messagesContainer;
    if (!container) return;

    let rafId = 0;
    const observer = new MutationObserver(() => {
      if (!isNearBottom()) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(scrollToBottom);
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  });

  $effect.pre(() => {
    if (isChatOpen) {
      tick().then(() => {
        scrollToBottom();
        textareaRef?.focus();
      });
    }
  });

  async function handleSubmit(message: PromptInput.PromptInputMessage) {
    chat.sendMessage({ text: message.text, files: message.files });
  }
</script>

{#if isChatOpen}
  <div
    class="fixed right-6 bottom-[calc(var(--spacing)*20)] z-50 flex h-[38rem] w-80 flex-col overflow-hidden rounded-xl border bg-background shadow-lg sm:w-96"
  >
    <div class="flex items-center gap-3 border-b p-3">
      <div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
        <MessageCircleIcon class="size-4 text-primary" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">AI Setup Assistant</p>
        <p class="text-xs text-muted-foreground">Helps you set up your store</p>
      </div>
      <Button variant="ghost" size="icon" onclick={() => (isChatOpen = false)}>
        <XIcon class="size-4" />
      </Button>
    </div>

    <ScrollArea bind:viewportRef={messagesContainer} class="flex-1">
      {#if chat.messages.length > 0}
        <div class="space-y-4 p-4">
          {#each chat.messages as message (message.id)}
            {#if message.role === "user"}
              {@const text = message.parts
                .filter(isTextUIPart)
                .map((p) => p.text)
                .join("")}
              <Message.Message from="user">
                <Message.MessageContent>
                  <Message.MessageResponse content={text} />
                </Message.MessageContent>
              </Message.Message>
            {:else if message.role === "assistant"}
              <Message.Message from="assistant">
                <Message.MessageContent>
                  <!-- Parts lack stable IDs (AI SDK TextUIPart/ReasoningUIPart/ToolUIPart); index is safe because parts are append-only and never reordered -->
                  {#each message.parts as part, partIndex (partIndex)}
                    {#if isReasoningUIPart(part)}
                      <Reasoning.Root isStreaming={part.state === "streaming"}>
                        <Reasoning.Trigger />
                        <Reasoning.Content>
                          {part.text}
                        </Reasoning.Content>
                      </Reasoning.Root>
                    {:else if isTextUIPart(part)}
                      <Message.MessageResponse content={part.text} />
                    {:else if isToolUIPart(part)}
                      <Tool.Root>
                        <Tool.Header type={getToolName(part)} state={part.state} />
                        <Tool.Content>
                          {#if part.input}
                            <Tool.Input input={part.input} />
                          {/if}
                          {#if part.state === "output-available"}
                            <Tool.Output output={part.output} />
                          {:else if part.state === "output-error"}
                            <Tool.Output errorText={part.errorText} />
                          {/if}
                        </Tool.Content>
                      </Tool.Root>
                    {/if}
                  {/each}
                </Message.MessageContent>
              </Message.Message>
            {/if}
          {/each}
          {#if chat.status === "submitted"}
            <div class="flex gap-2">
              <Loader variant="typing" />
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <MessageCircleIcon class="size-5 text-primary" />
          </div>
          <p class="text-sm text-muted-foreground">
            Tell me about your shop and I'll help you set it up!
          </p>
        </div>
      {/if}
    </ScrollArea>

    <PromptInput.Root onSubmit={handleSubmit} class="mx-auto my-2 w-92">
      <PromptInput.Toolbar class="items-end">
        <PromptInput.Textarea bind:ref={textareaRef} placeholder="Tell me about your shop..." />
        <PromptInput.Submit status={chat.status} onStop={() => chat.stop()} />
      </PromptInput.Toolbar>
    </PromptInput.Root>
  </div>
{/if}

<Button
  class="fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg"
  onclick={() => (isChatOpen = !isChatOpen)}
>
  {#if isChatOpen}
    <XIcon class="size-5" />
  {:else}
    <MessageCircleIcon class="size-5" />
  {/if}
</Button>
