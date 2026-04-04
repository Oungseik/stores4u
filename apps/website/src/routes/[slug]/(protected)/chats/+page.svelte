<script lang="ts">
  import { Chat, type UIMessage } from "@ai-sdk/svelte";
  import BotIcon from "@lucide/svelte/icons/bot";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import SendIcon from "@lucide/svelte/icons/send";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Textarea } from "@repo/ui/textarea";
  import { ThinkingDots } from "@repo/ui/thinking-dots";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { DefaultChatTransport, isTextUIPart } from "ai";
  import { onMount, tick } from "svelte";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { data }: PageProps = $props();
  const queryClient = useQueryClient();

  let currentChatId = $state<string | null>(null);
  let chat = $state<Chat<UIMessage> | null>(null);
  let inputValue = $state("");
  let messagesEndRef: HTMLDivElement | null = $state(null);
  let textareaRef: HTMLTextAreaElement | null = $state(null);
  let hasInitialized = $state(false);

  const chatsQuery = createQuery(() =>
    orpc.chats.list.queryOptions({ input: { slug: data.slug } })
  );

  const saveMessageMut = createMutation(() => orpc.chats.saveMessage.mutationOptions());

  const createChatMut = createMutation(() => orpc.chats.create.mutationOptions());

  const deleteChatMut = createMutation(() => orpc.chats.delete.mutationOptions());

  const updateChatMut = createMutation(() => orpc.chats.update.mutationOptions());

  const isChatBusy = $derived(chat?.status === "submitted" || chat?.status === "streaming");

  const chatItems = $derived(chatsQuery.data?.items ?? []);

  function invalidateChatsList() {
    queryClient.invalidateQueries({
      queryKey: orpc.chats.list.queryKey({ input: { slug: data.slug } }),
    });
  }

  function scrollToBottom() {
    tick().then(() => {
      messagesEndRef?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function adjustTextareaHeight() {
    if (textareaRef) {
      textareaRef.style.height = "auto";
      textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
    }
  }

  function createChatInstance(
    chatId: string,
    initialMessages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      createdAt?: Date;
    }>
  ): Chat<UIMessage> {
    const messages: UIMessage[] = initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    }));

    return new Chat({
      id: chatId,
      messages,
      transport: new DefaultChatTransport({
        api: "/api/ai/shop-assistant",
      }),
      onFinish: async ({ message }) => {
        const text = message.parts
          .filter(isTextUIPart)
          .map((p) => p.text)
          .join("");
        if (text) {
          try {
            await saveMessageMut.mutateAsync({
              slug: data.slug,
              chatId,
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
    });
  }

  async function selectChat(chatId: string) {
    currentChatId = chatId;
    try {
      const chatData = await queryClient.fetchQuery(
        orpc.chats.get.queryOptions({ input: { slug: data.slug, chatId } })
      );
      if (chatData) {
        chat = createChatInstance(chatId, chatData.messages);
        scrollToBottom();
      }
    } catch (e) {
      console.error("Failed to load chat:", e);
      toast.error("Failed to load chat");
    }
  }

  async function createNewChat() {
    try {
      const newChat = await createChatMut.mutateAsync({ slug: data.slug });
      currentChatId = newChat.id;
      chat = createChatInstance(newChat.id, []);
      invalidateChatsList();
      return newChat.id;
    } catch (e) {
      console.error("Failed to create chat:", e);
      toast.error("Failed to create chat");
      return undefined;
    }
  }

  async function handleSend() {
    const content = inputValue.trim();
    if (!content) return;
    if (chat?.status === "submitted" || chat?.status === "streaming") return;

    let chatId = currentChatId;

    if (!chatId) {
      try {
        const newChat = await createChatMut.mutateAsync({ slug: data.slug });
        chatId = newChat.id;
        currentChatId = chatId;
        chat = createChatInstance(chatId, []);
      } catch (e) {
        console.error("Failed to create chat:", e);
        toast.error("Failed to create chat");
        return;
      }
    }

    if (chat && chat.messages.length === 0) {
      const title = content.length > 50 ? content.slice(0, 50) + "..." : content;
      updateChatMut.mutate({ slug: data.slug, chatId, title });
    }

    const chatIdCopy = chatId;
    saveMessageMut
      .mutateAsync({
        slug: data.slug,
        chatId: chatIdCopy,
        role: "user",
        content,
      })
      .catch((e) => {
        console.error("Failed to save message:", e);
        toast.error("Failed to save message");
      });

    chat?.sendMessage({ text: content });
    inputValue = "";
    await tick();
    adjustTextareaHeight();
    scrollToBottom();
    invalidateChatsList();
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
        chat = null;
      }
    }
    invalidateChatsList();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    adjustTextareaHeight();
  }

  $effect(() => {
    chat?.messages;
    chat?.status;
    scrollToBottom();
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
    <div class="flex h-screen flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-2 border-b px-4">
        <Sidebar.Trigger class="-ms-1 lg:hidden" />
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

      <div class="flex-1 overflow-hidden">
        {#if !chat || chat.messages.length === 0}
          <div class="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
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
        {:else}
          <ScrollArea class="h-full px-4 py-4">
            <div class="mx-auto flex max-w-3xl flex-col gap-6">
              {#each chat.messages as message (message.id)}
                <div class="flex gap-3">
                  {#if message.role === "assistant"}
                    <Avatar.Root class="size-8 shrink-0">
                      <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                        AI
                      </Avatar.Fallback>
                    </Avatar.Root>
                  {:else}
                    <Avatar.Root class="size-8 shrink-0">
                      <Avatar.Image src={data.user.image ?? undefined} alt={data.user.name} />
                      <Avatar.Fallback>
                        {data.user.name.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  {/if}
                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">
                        {message.role === "assistant" ? "Assistant" : data.user.name}
                      </span>
                    </div>
                    {#if message.role === "assistant"}
                      {@const textParts = message.parts.filter(
                        (p): p is typeof p & { type: "text"; text: string } =>
                          isTextUIPart(p) && p.text.trim().length > 0
                      )}
                      {#if textParts.length > 0}
                        <div class="prose prose-sm dark:prose-invert max-w-none">
                          {#each textParts as part}
                            <p class="whitespace-pre-wrap">{part.text}</p>
                          {/each}
                        </div>
                      {:else}
                        <ThinkingDots class="text-sm" />
                      {/if}
                    {:else}
                      <div class="prose prose-sm dark:prose-invert max-w-none">
                        {#each message.parts as part}
                          {#if isTextUIPart(part)}
                            <p class="whitespace-pre-wrap">{part.text}</p>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
              {#if chat.status === "submitted"}
                <div class="flex gap-3">
                  <Avatar.Root class="size-8 shrink-0">
                    <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                      AI
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div class="flex min-w-0 flex-1 flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">Assistant</span>
                    </div>
                    <ThinkingDots class="text-sm" />
                  </div>
                </div>
              {/if}
              <div bind:this={messagesEndRef}></div>
            </div>
          </ScrollArea>
        {/if}
      </div>

      <div class="border-t p-4">
        <div class="mx-auto max-w-3xl">
          <div class="bg-background relative flex items-end gap-2 rounded-lg border p-2">
            <Textarea
              bind:value={inputValue}
              bind:ref={textareaRef}
              placeholder="Type a message... (Shift + Enter for new line)"
              class="min-h-[44px] resize-none border-0 bg-transparent py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              onkeydown={handleKeydown}
              oninput={handleInput}
            />
            <Button
              size="icon"
              class="shrink-0"
              disabled={!inputValue.trim() || isChatBusy}
              onclick={handleSend}
            >
              <SendIcon class="size-4" />
              <span class="sr-only">Send message</span>
            </Button>
          </div>
          <p class="text-muted-foreground mt-2 text-center text-xs">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
