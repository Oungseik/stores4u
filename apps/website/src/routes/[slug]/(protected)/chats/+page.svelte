<script lang="ts">
  import BotIcon from "@lucide/svelte/icons/bot";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import SendIcon from "@lucide/svelte/icons/send";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Spinner } from "@repo/ui/spinner";
  import { Textarea } from "@repo/ui/textarea";
  import { onMount, tick } from "svelte";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }

  interface Chat {
    id: string;
    title: string;
    updatedAt: Date;
  }

  // Mock data - in real app, this would come from API
  let chats = $state<Chat[]>([
    {
      id: "1",
      title: "Product inventory questions",
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      title: "Order status inquiry",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      title: "Pricing strategy discussion",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: "4",
      title: "Supplier recommendations",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  ]);

  let currentChatId = $state<string | null>(null);
  let messages = $state<Message[]>([]);
  let inputValue = $state("");
  let isLoading = $state(false);
  let messagesEndRef: HTMLDivElement | null = $state(null);
  let textareaRef: HTMLTextAreaElement | null = $state(null);

  function loadChat(chatId: string) {
    currentChatId = chatId;
    // Mock messages for demo
    messages = [
      {
        id: "1",
        role: "user",
        content: "Hi, I have some questions about my inventory.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Hello! I'd be happy to help you with your inventory questions. What would you like to know?",
        timestamp: new Date(Date.now() - 1000 * 60 * 29),
      },
      {
        id: "3",
        role: "user",
        content: "Can you tell me which products are running low on stock?",
        timestamp: new Date(Date.now() - 1000 * 60 * 28),
      },
      {
        id: "4",
        role: "assistant",
        content:
          "Let me check your inventory levels. Based on your current stock, here are the products that need attention:\n\n1. Wireless Headphones - 3 units remaining (reorder at 10)\n2. USB-C Cable - 5 units remaining (reorder at 20)\n3. Laptop Stand - 2 units remaining (reorder at 5)\n\nWould you like me to help you create purchase orders for these items?",
        timestamp: new Date(Date.now() - 1000 * 60 * 27),
      },
    ];
    scrollToBottom();
  }

  function scrollToBottom() {
    tick().then(() => {
      messagesEndRef?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function handleSend() {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    messages = [...messages, userMessage];
    inputValue = "";
    await tick();
    adjustTextareaHeight();
    scrollToBottom();

    isLoading = true;
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "I understand your question. As an AI assistant, I'm here to help you with your shop management tasks. How else can I assist you today?",
      timestamp: new Date(),
    };

    messages = [...messages, assistantMessage];
    isLoading = false;
    scrollToBottom();

    // Update chat title if it's the first message
    if (messages.length === 2 && currentChatId) {
      const chatIndex = chats.findIndex((c) => c.id === currentChatId);
      if (chatIndex !== -1 && chats[chatIndex].title === "New Chat") {
        const updatedChats = [...chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : ""),
        };
        chats = updatedChats;
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function adjustTextareaHeight() {
    if (textareaRef) {
      textareaRef.style.height = "auto";
      textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
    }
  }

  function deleteChat(chatId: string) {
    chats = chats.filter((c) => c.id !== chatId);
    if (currentChatId === chatId) {
      currentChatId = null;
      messages = [];
    }
  }

  function handleInput() {
    adjustTextareaHeight();
  }

  onMount(() => {
    if (chats.length > 0 && !currentChatId) {
      loadChat(chats[0].id);
    }
  });
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <header class="flex h-14 items-center gap-2 border-b px-4">
    <Sidebar.Trigger class="-ms-1 lg:hidden" />
    {#if currentChatId}
      <div class="flex flex-1 items-center justify-between">
        <h1 class="font-medium">
          {chats.find((c) => c.id === currentChatId)?.title ?? "Chat"}
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
            <DropdownMenu.Item onclick={() => currentChatId && deleteChat(currentChatId)}>
              Delete Chat
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    {:else}
      <h1 class="font-medium">New Chat</h1>
    {/if}
  </header>

  <!-- Messages Area -->
  <div class="flex-1 overflow-hidden">
    {#if messages.length === 0}
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
          {#each messages as message (message.id)}
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
                  <Avatar.Fallback>{data.user.name.charAt(0).toUpperCase()}</Avatar.Fallback>
                </Avatar.Root>
              {/if}
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">
                    {message.role === "assistant" ? "Assistant" : data.user.name}
                  </span>
                  <span class="text-muted-foreground text-xs">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  <p class="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          {/each}
          {#if isLoading}
            <div class="flex gap-3">
              <Avatar.Root class="size-8 shrink-0">
                <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                  AI
                </Avatar.Fallback>
              </Avatar.Root>
              <Spinner class="size-5" />
            </div>
          {/if}
          <div bind:this={messagesEndRef}></div>
        </div>
      </ScrollArea>
    {/if}
  </div>

  <!-- Input Area -->
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
          disabled={!inputValue.trim() || isLoading}
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
