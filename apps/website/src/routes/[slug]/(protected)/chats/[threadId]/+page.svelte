<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import * as Message from "@repo/ui/ai-elements/message";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";
  import * as Reasoning from "@repo/ui/ai-elements/reasoning";
  import * as Tool from "@repo/ui/ai-elements/tool";
  import * as Avatar from "@repo/ui/avatar";
  import { Loader } from "@repo/ui/prompt-kit/loader";
  import { Spinner } from "@repo/ui/spinner";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { DefaultChatTransport, getToolName, isReasoningUIPart, isTextUIPart, isToolUIPart } from "ai";

  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  let { data, params }: PageProps = $props();
  let threadId = $derived(params.threadId);

  let messagesContainer = $state<HTMLDivElement | null>(null);
  let hasExistingMessages = $state(false);

  const queryClient = useQueryClient();

  let messagesQuery = createQuery(() =>
    orpc.threads.getMessages.queryOptions({
      input: { slug: data.slug, threadId },
    })
  );

  let chat = $derived(
    new Chat({
      transport: new DefaultChatTransport({
        api: `/api/ai/${data.slug}/shop-assistant`,
        body: { threadId },
      }),
      onFinish: () => {
        queryClient.invalidateQueries({ queryKey: orpc.threads.list.key() });
      },
    })
  );

  $effect(() => {
    const msgs = messagesQuery.data?.messages;
    if (msgs && msgs.length > 0 && chat.messages.length === 0) {
      chat.messages = msgs;
      hasExistingMessages = true;
    }
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

  async function handleSubmit(message: PromptInput.PromptInputMessage) {
    chat.sendMessage({
      text: message.text,
      files: message.files,
    });
  }
</script>

<div class="flex flex-1 flex-col overflow-hidden">
  {#if chat.messages.length > 0}
    <div class="flex-1 overflow-y-auto" bind:this={messagesContainer}>
      <div class="mx-auto max-w-4xl space-y-4 p-4">
        {#each chat.messages as message (message.id)}
          {#if message.role === "user"}
            {@const text = message.parts
              .filter(isTextUIPart)
              .map((p) => p.text)
              .join("")}
            {@const attachments = message.parts.filter((p) => p.type === "file")}
            <Message.Message from="user">
              <div class="mb-4 flex flex-row-reverse gap-3">
                <Avatar.Root class="size-8 shrink-0">
                  <Avatar.Image src={data.user.image ?? undefined} alt={data.user.name} />
                  <Avatar.Fallback>
                    {data.user.name.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="flex min-w-0 flex-1 flex-col items-end gap-1">
                  <Message.MessageContent>
                    <Message.MessageResponse content={text} />
                  </Message.MessageContent>
                  {#if attachments.length > 0}
                    <Message.MessageAttachments>
                      {#each attachments as attachment (attachment.url)}
                        <Message.MessageAttachment
                          data={{
                            type: "file",
                            url: attachment.url,
                            mediaType: attachment.mediaType,
                            filename: attachment.filename,
                          }}
                        />
                      {/each}
                    </Message.MessageAttachments>
                  {/if}
                </div>
              </div>
            </Message.Message>
          {:else if message.role === "assistant"}
            <Message.Message from="assistant">
              <div class="mb-4 flex gap-3">
                <Avatar.Root class="size-8 shrink-0">
                  <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                    AI
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <Message.MessageContent>
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
                </div>
              </div>
            </Message.Message>
          {/if}
        {/each}
        {#if chat.status === "submitted"}
          <div class="mb-4 flex gap-3">
            <Avatar.Root class="size-8 shrink-0">
              <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                AI
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <Loader variant="typing" />
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else if chat.status === "submitted"}
    <div class="flex flex-1 items-center justify-center">
      <Spinner class="text-muted-foreground size-8" />
    </div>
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <p class="text-muted-foreground text-sm">Send a message to start the conversation.</p>
    </div>
  {/if}

  <div class="mx-auto w-full max-w-4xl p-4 pt-0">
    <PromptInput.Root accept="image/*,.pdf" globalDrop maxFiles={5} onSubmit={handleSubmit}>
      <PromptInput.Attachments>
        {#snippet children(attachment)}
          <PromptInput.Attachment data={attachment} />
        {/snippet}
      </PromptInput.Attachments>
      <PromptInput.Toolbar class="flex-1">
        <PromptInput.Tools class="flex-1">
          <PromptInput.ActionMenu>
            <PromptInput.ActionMenuTrigger />
            <PromptInput.ActionMenuContent class="min-w-50">
              <PromptInput.ActionAddAttachments />
            </PromptInput.ActionMenuContent>
          </PromptInput.ActionMenu>
          <PromptInput.Textarea placeholder="Type a message..." class="flex-1" />
        </PromptInput.Tools>
        <PromptInput.Submit status={chat.status} onStop={() => chat.stop()} />
      </PromptInput.Toolbar>
    </PromptInput.Root>
    <p class="text-muted-foreground mt-2 text-center text-xs">
      AI can make mistakes. Please verify important information.
    </p>
  </div>
</div>
