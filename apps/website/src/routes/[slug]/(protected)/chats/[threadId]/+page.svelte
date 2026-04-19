<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import * as Message from "@repo/ui/ai-elements/message";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";
  import * as Avatar from "@repo/ui/avatar";
  import { Loader } from "@repo/ui/prompt-kit/loader";
  import { Spinner } from "@repo/ui/spinner";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { DefaultChatTransport, isTextUIPart } from "ai";
  import { onMount } from "svelte";

  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  let { data, params }: PageProps = $props();
  let threadId = $derived(params.threadId);

  let messagesContainer = $state<HTMLDivElement | null>(null);
  let titleUpdated = $state(false);
  let hasExistingMessages = $state(false);

  const queryClient = useQueryClient();

  let messagesQuery = createQuery(() =>
    orpc.threads.getMessages.queryOptions({
      input: { slug: data.slug, threadId },
    })
  );

  let updateTitleMutation = createMutation(() =>
    orpc.threads.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.threads.list.key() });
      },
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

        if (!hasExistingMessages && !titleUpdated) {
          const firstUserMsg = chat.messages.find((m) => m.role === "user");
          if (firstUserMsg) {
            const text = firstUserMsg.parts
              .filter(isTextUIPart)
              .map((p) => p.text)
              .join("");
            const title = text.slice(0, 50).trim() || "New Chat";
            updateTitleMutation.mutate({ slug: data.slug, threadId, title });
            titleUpdated = true;
          }
        }
      },
    })
  );

  $effect(() => {
    const tid = threadId;
    const msgs = messagesQuery.data?.messages;
    if (msgs && msgs.length > 0 && chat.messages.length === 0) {
      chat.messages = msgs;
      hasExistingMessages = true;
    }
  });

  async function handleSubmit(message: PromptInput.PromptInputMessage) {
    chat.sendMessage({
      text: message.text,
      files: message.files,
    });
  }

  $effect(() => {
    chat?.messages;
    chat?.status;
    if (messagesContainer) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      if (scrollHeight - scrollTop - clientHeight < 250) {
        requestAnimationFrame(() => {
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        });
      }
    }
  });

  onMount(() => {
    const state = history.state satisfies Record<string, unknown> | null;
    if (state && "initialMessage" in state && typeof state.initialMessage === "string") {
      chat.sendMessage({ text: state.initialMessage, files: [] });
      history.replaceState({}, "");
    }
  });
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
            {@const text = message.parts
              .filter(isTextUIPart)
              .map((p) => p.text)
              .join("")}
            <Message.Message from="assistant">
              <div class="mb-4 flex gap-3">
                <Avatar.Root class="size-8 shrink-0">
                  <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                    AI
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <Message.MessageContent>
                    <Message.MessageResponse content={text} />
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
              <span class="text-sm font-medium">Assistant</span>
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
