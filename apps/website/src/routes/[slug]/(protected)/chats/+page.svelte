<script lang="ts">
  import type { UIMessage } from "@ai-sdk/svelte";
  import { Chat } from "@ai-sdk/svelte";
  import BotIcon from "@lucide/svelte/icons/bot";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import * as Message from "@repo/ui/ai-elements/message";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { DefaultChatTransport, isTextUIPart } from "ai";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { data }: PageProps = $props();
  const queryClient = useQueryClient();

  let currentChatId = $state<string | null>(null);
  let chatMessages = $state<UIMessage[]>([]);
  let hasInitialized = $state(false);
  let isLoadingChat = $state(false);
  let isRenameDialogOpen = $state(false);
  let renameTitle = $state("");
  let messagesContainer = $state<HTMLDivElement | null>(null);

  let chat = $derived(
    new Chat({
      transport: new DefaultChatTransport({ api: `/api/ai/${data.slug}/shop-assistant` }),
      onFinish: async ({ message }) => {
        if (!currentChatId) return;
        const text = message.parts
          .filter(isTextUIPart)
          .map((p) => p.text)
          .join("");
        if (text) {
          try {
            await saveMessageMut.mutateAsync({
              slug: data.slug,
              chatId: currentChatId,
              role: "assistant",
              content: text,
            });
            invalidateChatsList();
          } catch (e) {
            console.error("Failed to save assistant message:", e);
            toast.error("Failed to save assistant message");
          }
        }
      },
    })
  );

  const pendingFileIds = new Map<string, Promise<string | void>>();

  const chatsQuery = createQuery(() =>
    orpc.chats.list.queryOptions({ input: { slug: data.slug } })
  );

  const saveMessageMut = createMutation(() => orpc.chats.saveMessage.mutationOptions());
  const createChatMut = createMutation(() => orpc.chats.create.mutationOptions());
  const deleteChatMut = createMutation(() => orpc.chats.delete.mutationOptions());
  const updateChatMut = createMutation(() => orpc.chats.update.mutationOptions());
  const uploadFileMut = createMutation(() => orpc.purchaseInvoices.uploadFile.mutationOptions());

  const chatItems = $derived(chatsQuery.data?.items ?? []);

  function invalidateChatsList() {
    queryClient.invalidateQueries({
      queryKey: orpc.chats.list.queryKey({ input: { slug: data.slug } }),
    });
  }

  async function selectChat(chatId: string) {
    currentChatId = chatId;
    isLoadingChat = true;
    chatMessages = [];
    try {
      const chatData = await queryClient.fetchQuery(
        orpc.chats.get.queryOptions({ input: { slug: data.slug, chatId } })
      );
      if (chatData) {
        chatMessages = chatData.messages.map(
          (m) =>
            ({
              id: m.id,
              role: m.role,
              parts: [{ type: "text" as const, text: m.content }],
            }) satisfies UIMessage
        );
      }
    } catch (e) {
      console.error("Failed to load chat:", e);
      toast.error("Failed to load chat");
    } finally {
      isLoadingChat = false;
    }
  }

  async function createNewChat() {
    if (chatMessages.length === 0 && currentChatId) {
      return currentChatId;
    }
    try {
      const newChat = await createChatMut.mutateAsync({ slug: data.slug });
      currentChatId = newChat.id;
      chatMessages = [];
      invalidateChatsList();
      return newChat.id;
    } catch (e) {
      console.error("Failed to create chat:", e);
      toast.error("Failed to create chat");
      return undefined;
    }
  }

  async function handleDeleteChat(chatId: string) {
    try {
      await deleteChatMut.mutateAsync({ slug: data.slug, chatId });
    } catch (e) {
      console.error("Failed to delete chat:", e);
      toast.error("Failed to delete chat");
      return;
    }
    if (currentChatId === chatId) {
      const remaining = chatsQuery.data?.items.filter((c) => c.id !== chatId) ?? [];
      if (remaining.length > 0) {
        await selectChat(remaining[0].id);
      } else {
        currentChatId = null;
        chatMessages = [];
      }
    }
    invalidateChatsList();
  }

  function openRenameDialog() {
    const currentTitle = chatItems.find((c) => c.id === currentChatId)?.title ?? "";
    renameTitle = currentTitle;
    isRenameDialogOpen = true;
  }

  async function handleRenameChat() {
    if (!currentChatId || !renameTitle.trim()) return;
    try {
      await updateChatMut.mutateAsync({
        slug: data.slug,
        chatId: currentChatId,
        title: renameTitle.trim(),
      });
      invalidateChatsList();
      isRenameDialogOpen = false;
    } catch (e) {
      console.error("Failed to rename chat:", e);
      toast.error("Failed to rename chat");
    }
  }

  function handleFileAdd(
    added: PromptInput.PromptInputAttachmentData[],
    _all: PromptInput.PromptInputAttachmentData[]
  ) {
    for (const attachment of added) {
      uploadFileMut.mutateAsync({ slug: data.slug, file: attachment.file });
    }
  }

  async function handleSubmit(message: PromptInput.PromptInputMessage) {
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const newChat = await createChatMut.mutateAsync({ slug: data.slug });
        chatId = newChat.id;
        currentChatId = chatId;
      } catch (e) {
        console.error("Failed to create chat:", e);
        toast.error("Failed to create chat");
        return;
      }
    }

    if (chat.messages.length === 0) {
      const title = message.text.length > 50 ? message.text.slice(0, 50) + "..." : message.text;
      updateChatMut.mutate({ slug: data.slug, chatId, title });
    }

    const allFilePromises = Array.from(pendingFileIds.values());
    pendingFileIds.clear();

    saveMessageMut
      .mutateAsync({
        slug: data.slug,
        chatId,
        role: "user",
        content: message.text,
      })
      .catch((e) => {
        console.error("Failed to save message:", e);
        toast.error("Failed to save message");
      });

    invalidateChatsList();

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
    if (chatItems.length > 0 && !currentChatId && !hasInitialized) {
      hasInitialized = true;
      selectChat(chatItems[0].id);
    }
  });
</script>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  class="h-dvh min-h-0 overflow-hidden"
>
  <ChatsSidebar
    variant="inset"
    shop={{ id: data.id, name: data.name, slug: data.slug, logo: data.logo }}
    user={data.user}
    currentPath={page.url.pathname}
    chats={chatItems.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
    }))}
    currentChatId={currentChatId ?? undefined}
    onNewChat={createNewChat}
    onSelectChat={(id) => selectChat(id)}
    onDeleteChat={handleDeleteChat}
  />
  <Sidebar.Inset>
    <div class="flex h-full flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-2 border-b px-4">
        <Sidebar.Trigger class="-ms-1" />
        {#if currentChatId}
          <div class="flex flex-1 items-center justify-between">
            <h1 class="font-medium">
              {chatItems.find((c) => c.id === currentChatId)?.title ?? "Chat"}
            </h1>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button variant="ghost" size="icon" {...props}>
                    <MoreHorizontalIcon class="size-4" />
                    <span class="sr-only">More options</span>
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onclick={openRenameDialog}>Rename Chat</DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => currentChatId && handleDeleteChat(currentChatId)}>
                  Delete Chat
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        {:else}
          <h1 class="font-medium">New Chat</h1>
        {/if}
      </header>

      <div class="flex flex-1 flex-col overflow-hidden">
        {#if isLoadingChat}
          <div class="flex flex-1 items-center justify-center">
            <Spinner class="text-muted-foreground size-8" />
          </div>
        {:else if chat.messages.length > 0}
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
                    <div class="flex items-center gap-1">
                      <span class="bg-foreground/80 size-1.5 animate-bounce rounded-full"></span>
                      <span
                        class="bg-foreground/80 size-1.5 animate-bounce rounded-full"
                        style="animation-delay: 0.2s"
                      ></span>
                      <span
                        class="bg-foreground/80 size-1.5 animate-bounce rounded-full"
                        style="animation-delay: 0.4s"
                      ></span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
            <div class="bg-primary/10 flex size-12 items-center justify-center rounded-full">
              <BotIcon class="text-primary size-6" />
            </div>
            <div class="flex max-w-md flex-col gap-2">
              <h2 class="text-lg font-semibold">How can I help you today?</h2>
              <p class="text-muted-foreground text-sm">
                I can help you manage your inventory, analyze sales data, create reports, and answer
                questions about your shop.
              </p>
            </div>
          </div>
        {/if}

        <div class="mx-auto w-full max-w-4xl p-4 pt-0">
          <PromptInput.Root
            accept="image/*,.pdf"
            globalDrop
            maxFiles={5}
            onFileAdd={handleFileAdd}
            onSubmit={handleSubmit}
          >
            <PromptInput.Attachments>
              {#snippet children(attachment)}
                <PromptInput.Attachment data={attachment} />
              {/snippet}
            </PromptInput.Attachments>
            <PromptInput.Toolbar>
              <PromptInput.Tools>
                <PromptInput.ActionMenu>
                  <PromptInput.ActionMenuTrigger />
                  <PromptInput.ActionMenuContent class="min-w-50">
                    <PromptInput.ActionAddAttachments />
                  </PromptInput.ActionMenuContent>
                </PromptInput.ActionMenu>
                <PromptInput.Textarea placeholder="Type a message..." />
              </PromptInput.Tools>
              <PromptInput.Submit status={chat.status} onStop={() => chat.stop()} />
            </PromptInput.Toolbar>
          </PromptInput.Root>
          <p class="text-muted-foreground mt-2 text-center text-xs">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

<Dialog.Root bind:open={isRenameDialogOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Rename Chat</Dialog.Title>
      <Dialog.Description>Enter a new name for this chat.</Dialog.Description>
    </Dialog.Header>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleRenameChat();
      }}
    >
      <div class="py-4">
        <Input bind:value={renameTitle} placeholder="Chat title" autofocus />
      </div>
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (isRenameDialogOpen = false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!renameTitle.trim() || updateChatMut.status === "pending"}>
          {updateChatMut.status === "pending" ? "Saving..." : "Save"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
