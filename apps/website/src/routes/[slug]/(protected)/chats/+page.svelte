<script lang="ts">
  import type { UIMessage } from "@ai-sdk/svelte";
  import BotIcon from "@lucide/svelte/icons/bot";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";
  import { ThinkingDots } from "@repo/ui/thinking-dots";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { isTextUIPart } from "ai";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import * as AiChat from "$lib/components/ai-chat";
  import { renderMarkdown } from "$lib/components/ai-chat/render-markdown.js";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";
  import ChatsSidebar from "./chats-sidebar.svelte";

  let { data }: PageProps = $props();
  const queryClient = useQueryClient();

  let currentChatId = $state<string | null>(null);
  let chatMessages = $state<AiChat.InitialMessage[]>([]);
  let hasInitialized = $state(false);
  let isLoadingChat = $state(false);

  const chatsQuery = createQuery(() =>
    orpc.chats.list.queryOptions({ input: { slug: data.slug } })
  );

  const saveMessageMut = createMutation(() => orpc.chats.saveMessage.mutationOptions());

  const createChatMut = createMutation(() => orpc.chats.create.mutationOptions());

  const deleteChatMut = createMutation(() => orpc.chats.delete.mutationOptions());

  const updateChatMut = createMutation(() => orpc.chats.update.mutationOptions());

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
        chatMessages = chatData.messages;
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

  async function handleOnSend({ text, messageCount }: { text: string; messageCount: number }) {
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

    if (messageCount === 0) {
      const title = text.length > 50 ? text.slice(0, 50) + "..." : text;
      updateChatMut.mutate({ slug: data.slug, chatId, title });
    }

    saveMessageMut
      .mutateAsync({
        slug: data.slug,
        chatId,
        role: "user",
        content: text,
      })
      .catch((e) => {
        console.error("Failed to save message:", e);
        toast.error("Failed to save message");
      });

    invalidateChatsList();
    return chatId;
  }

  async function handleOnFinish({ message }: { message: UIMessage }) {
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
  }

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
        {#if isLoadingChat}
          <div class="flex h-full items-center justify-center">
            <Spinner class="text-muted-foreground size-8" />
          </div>
        {:else}
          {#key currentChatId}
            <AiChat.Root
              chatId={currentChatId ?? undefined}
              api={`/api/ai/${data.slug}/shop-assistant`}
              initialMessages={chatMessages}
              onSend={handleOnSend}
              onFinish={handleOnFinish}
            >
              <AiChat.FullPageContainer>
                <AiChat.Messages
                  empty={welcomeSnippet}
                  userMessage={userMessageSnippet}
                  assistantMessage={assistantMessageSnippet}
                  generating={generatingSnippet}
                />
                <AiChat.Input placeholder="Type a message...">
                  <AiChat.SendButton />
                </AiChat.Input>
                <AiChat.Footer />
              </AiChat.FullPageContainer>
            </AiChat.Root>
          {/key}
        {/if}
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

{#snippet welcomeSnippet()}
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
{/snippet}

{#snippet userMessageSnippet({ text }: { text: string })}
  <div class="mb-4 flex flex-row-reverse gap-3">
    <Avatar.Root class="size-8 shrink-0">
      <Avatar.Image src={data.user.image ?? undefined} alt={data.user.name} />
      <Avatar.Fallback>
        {data.user.name.charAt(0).toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
    <div class="flex min-w-0 flex-1 flex-col items-end gap-1">
      <span class="text-sm font-medium">{data.user.name}</span>
      <div class="prose prose-sm dark:prose-invert max-w-none">
        {@html renderMarkdown(text)}
      </div>
    </div>
  </div>
{/snippet}

{#snippet assistantMessageSnippet({ textParts }: { textParts: string[]; toolParts: unknown[] })}
  <div class="mb-4 flex gap-3">
    <Avatar.Root class="size-8 shrink-0">
      <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">AI</Avatar.Fallback>
    </Avatar.Root>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="text-sm font-medium">Assistant</span>
      <div class="prose prose-sm dark:prose-invert max-w-none">
        {#each textParts as partText}
          {@html renderMarkdown(partText)}
        {/each}
      </div>
    </div>
  </div>
{/snippet}

{#snippet generatingSnippet()}
  <div class="mb-4 flex gap-3">
    <Avatar.Root class="size-8 shrink-0">
      <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">AI</Avatar.Fallback>
    </Avatar.Root>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="text-sm font-medium">Assistant</span>
      <ThinkingDots class="text-sm" />
    </div>
  </div>
{/snippet}
