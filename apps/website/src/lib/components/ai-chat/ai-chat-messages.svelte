<script lang="ts">
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import { ThinkingDots } from "@repo/ui/thinking-dots";
  import { isTextUIPart, isToolUIPart } from "ai";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import { renderMarkdown } from "./render-markdown.js";
  import type { AiChatMessagesProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    empty,
    userMessage,
    assistantMessage,
    generating,
    toolResult,
  }: AiChatMessagesProps = $props();

  const ctx = useAiChatChild();

  $effect(() => {
    ctx.chat.messages;
    ctx.chat.status;
    setTimeout(() => ctx.scrollToBottom(), 50);
  });
</script>

{#snippet DefaultGenerating()}
  <div class="mb-3 flex justify-start">
    <div class="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
      <ThinkingDots class="text-xs" />
    </div>
  </div>
{/snippet}

<div bind:this={ref} class={["flex-1 overflow-y-auto px-4 py-3", className]}>
  {#if ctx.chat.messages.length === 0}
    {#if empty}
      {@render empty()}
    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div class="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <MessageCircleIcon class="text-primary size-6" />
        </div>
        <div>
          <p class="text-sm font-medium">Welcome!</p>
          <p class="text-muted-foreground mt-1 text-xs">How can I help?</p>
        </div>
      </div>
    {/if}
  {:else}
    {#each ctx.chat.messages as message (message.id)}
      {#if message.role === "user"}
        {@const text = message.parts
          .filter((p) => isTextUIPart(p))
          .map((p) => p.text)
          .join("")}
        {#if userMessage}
          {@render userMessage({ text })}
        {:else}
          <div class="mb-3 flex justify-end">
            <div
              class="bg-primary text-primary-foreground prose prose-invert prose-sm max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm"
            >
              {@html renderMarkdown(text)}
            </div>
          </div>
        {/if}
      {:else if message.role === "assistant"}
        {@const textParts = message.parts.filter((p) => isTextUIPart(p))}
        {@const completedToolParts = message.parts.filter(
          (p) => isToolUIPart(p) && p.state === "output-available"
        )}
        {#if textParts.length > 0}
          {#if assistantMessage}
            {@render assistantMessage({
              textParts: textParts.map((p) => p.text),
              toolParts: completedToolParts,
            })}
          {:else}
            <div class="mb-3 flex justify-start">
              <div
                class="bg-muted prose prose-sm max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-3 text-sm"
              >
                {#each textParts as part}
                  {@html renderMarkdown(part.text)}
                {/each}
              </div>
            </div>
          {/if}
        {:else if generating}
          {@render generating()}
        {:else}
          {@render DefaultGenerating()}
        {/if}
        {#each completedToolParts as _part}
          {#if toolResult}
            {@render toolResult()}
          {:else}
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
              <span class="text-xs">Done!</span>
            </div>
          {/if}
        {/each}
      {/if}
    {/each}

    {#if ctx.chat.status === "submitted"}
      {#if generating}
        {@render generating()}
      {:else}
        {@render DefaultGenerating()}
      {/if}
    {/if}
  {/if}
</div>
