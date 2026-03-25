<script lang="ts">
  import type { IconProps } from "@lucide/svelte";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import BarChartIcon from "@lucide/svelte/icons/bar-chart-3";
  import BotIcon from "@lucide/svelte/icons/bot";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import PenToolIcon from "@lucide/svelte/icons/pen-tool";
  import SendIcon from "@lucide/svelte/icons/send";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Textarea } from "@repo/ui/textarea";
  import * as Tooltip from "@repo/ui/tooltip";
  import { siFacebook, siTelegram, siTiktok } from "simple-icons";
  import type { Component } from "svelte";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  // Types
  type AgentStatus = "online" | "busy" | "offline";
  type TaskStatus = "pending" | "processing" | "completed" | "failed";
  type MessageType = "text" | "review";

  interface Agent {
    id: string;
    name: string;
    role: string;
    icon: Component<IconProps>;
    status: AgentStatus;
    description: string;
    color: string;
  }

  interface Task {
    id: string;
    title: string;
    agentId: string;
    status: TaskStatus;
    createdAt: string;
  }

  interface Message {
    id: string;
    sender: "user" | "agent";
    agentId?: string;
    type: MessageType;
    content: string;
    timestamp: string;
    reviewData?: ReviewData;
  }

  interface ReviewData {
    type: "invoice" | "content";
    title: string;
    preview: string;
    platforms?: string[];
  }

  // Mock Agents Data
  const agents: Agent[] = [
    {
      id: "general",
      name: "General Agent",
      role: "Coordinator",
      icon: BotIcon,
      status: "online",
      description: "Main coordinator for all tasks",
      color: "bg-blue-500",
    },
    {
      id: "content",
      name: "ContentWriter",
      role: "Social Media",
      icon: PenToolIcon,
      status: "online",
      description: "Creates posts for social platforms",
      color: "bg-purple-500",
    },
    {
      id: "invoice",
      name: "InvoiceProcessor",
      role: "Data Entry",
      icon: FileTextIcon,
      status: "busy",
      description: "Processes invoices and receipts",
      color: "bg-green-500",
    },
    {
      id: "inventory",
      name: "InventoryManager",
      role: "Stock Control",
      icon: PackageIcon,
      status: "online",
      description: "Manages stock and inventory",
      color: "bg-orange-500",
    },
    {
      id: "order",
      name: "OrderHandler",
      role: "Order Processing",
      icon: ShoppingCartIcon,
      status: "offline",
      description: "Handles order fulfillment",
      color: "bg-pink-500",
    },
    {
      id: "product",
      name: "ProductManager",
      role: "Product Updates",
      icon: SparklesIcon,
      status: "online",
      description: "Updates product information",
      color: "bg-cyan-500",
    },
    {
      id: "analytics",
      name: "AnalyticsBot",
      role: "Reports",
      icon: BarChartIcon,
      status: "online",
      description: "Generates analytics reports",
      color: "bg-indigo-500",
    },
  ];

  // Mock Tasks Data
  const tasks: Task[] = [
    {
      id: "1",
      title: "Process invoice #INV-2024-001",
      agentId: "invoice",
      status: "processing",
      createdAt: "2 min ago",
    },
    {
      id: "2",
      title: "Create Instagram post for new product",
      agentId: "content",
      status: "pending",
      createdAt: "5 min ago",
    },
    {
      id: "3",
      title: "Check low stock items",
      agentId: "inventory",
      status: "completed",
      createdAt: "10 min ago",
    },
    {
      id: "4",
      title: "Generate monthly sales report",
      agentId: "analytics",
      status: "pending",
      createdAt: "15 min ago",
    },
  ];

  // Mock Chat History
  const messages: Message[] = [
    {
      id: "1",
      sender: "agent",
      agentId: "general",
      type: "text",
      content:
        "Hello! I'm your AI assistant. I can help you with inventory management, order processing, invoice data entry, product updates, analytics, and social media content creation. What would you like me to do today?",
      timestamp: "10:00 AM",
    },
    {
      id: "2",
      sender: "user",
      type: "text",
      content: "Check low stock items please",
      timestamp: "10:05 AM",
    },
    {
      id: "3",
      sender: "agent",
      agentId: "inventory",
      type: "text",
      content:
        "I've checked your inventory. Here are the items with low stock (below 10 units):\n\n• Premium Coffee Beans - 3 units left\n• Ceramic Mugs (Set of 4) - 5 units left\n• Espresso Cups - 2 units left\n\nWould you like me to create a purchase order for these items?",
      timestamp: "10:06 AM",
    },
    {
      id: "4",
      sender: "user",
      type: "text",
      content: "Yes, please create a purchase order for the top 5 low stock items",
      timestamp: "10:07 AM",
    },
    {
      id: "5",
      sender: "agent",
      agentId: "inventory",
      type: "text",
      content:
        "I've created a purchase order draft for the top 5 low stock items. Order #PO-2024-089 is ready for your review in the Purchases section.",
      timestamp: "10:08 AM",
    },
    {
      id: "6",
      sender: "user",
      type: "text",
      content: "I have an invoice image to process",
      timestamp: "10:15 AM",
    },
    {
      id: "7",
      sender: "agent",
      agentId: "invoice",
      type: "text",
      content: "I've received your invoice image. Let me process it for you...",
      timestamp: "10:15 AM",
    },
    {
      id: "8",
      sender: "agent",
      agentId: "invoice",
      type: "review",
      content: "I've extracted the data from your invoice. Please review the details below:",
      timestamp: "10:16 AM",
      reviewData: {
        type: "invoice",
        title: "Invoice #INV-2024-001",
        preview:
          "Supplier: Coffee Wholesale Inc.\nDate: 2024-03-15\nTotal: $1,250.00\nItems: 12\n• Premium Coffee Beans (5kg) x 10\n• Paper Cups (1000pcs) x 2",
      },
    },
    {
      id: "9",
      sender: "user",
      type: "text",
      content: "Create a social media post for our new Cold Brew product with these images",
      timestamp: "10:20 AM",
    },
    {
      id: "10",
      sender: "agent",
      agentId: "content",
      type: "text",
      content:
        "I'm creating engaging content for your Cold Brew launch. This will be perfect for Facebook, TikTok, and messaging platforms!",
      timestamp: "10:21 AM",
    },
    {
      id: "11",
      sender: "agent",
      agentId: "content",
      type: "review",
      content: "Here's the content I created for your Cold Brew product:",
      timestamp: "10:22 AM",
      reviewData: {
        type: "content",
        title: "Cold Brew Launch Post",
        preview:
          "☕ NEW: Smooth Cold Brew is here!\n\nBeat the heat with our signature slow-steeped Cold Brew. Rich, bold, and perfectly chilled.\n\n✨ Now available in-store and online\n🚀 Limited time: 20% off your first order\n\n#ColdBrew #CoffeeLovers #SummerVibes",
        platforms: ["facebook", "tiktok", "telegram"],
      },
    },
  ];

  let selectedAgent = $state<string | null>(null);
  let newMessage = $state("");
  let chatContainer: HTMLDivElement;

  // Scroll to bottom on mount
  $effect(() => {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  function getAgentById(id: string) {
    return agents.find((a) => a.id === id);
  }

  function getStatusBadgeVariant(status: TaskStatus) {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "completed":
        return "outline";
      case "failed":
        return "destructive";
    }
  }

  function getStatusIcon(status: TaskStatus): Component<IconProps> {
    switch (status) {
      case "pending":
        return ClockIcon;
      case "processing":
        return Loader2Icon;
      case "completed":
        return CheckCircleIcon;
      case "failed":
        return AlertCircleIcon;
    }
  }

  function handleSendMessage() {
    if (newMessage.trim()) {
      // In real implementation, this would send the message
      newMessage = "";
    }
  }

  function handleApprove(reviewId: string) {
    // In real implementation, this would approve the review
    console.log("Approved:", reviewId);
  }

  function handleReject(reviewId: string) {
    // In real implementation, this would reject the review
    console.log("Rejected:", reviewId);
  }
</script>

<div class="flex h-[calc(100dvh-var(--spacing)*4)] flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
  <!-- Left Panel: Agent Roster -->
  <aside class="flex w-full flex-col gap-4 md:w-72">
    <div class="flex h-9 items-center justify-between">
      <div class="flex items-center gap-1 lg:gap-2">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${params.slug}/admin`}>Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>AI Agents</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </div>

    <Card.Root class="flex-1 overflow-hidden">
      <Card.Header class="pb-3">
        <Card.Title class="flex items-center gap-2 text-base">
          <BotIcon class="size-5" />
          Agent Roster
        </Card.Title>
        <Card.Description>
          {agents.filter((a) => a.status === "online").length} of {agents.length} agents online
        </Card.Description>
      </Card.Header>
      <Card.Content class="p-0">
        <ScrollArea class="h-[calc(100vh-16rem)] px-4">
          <div class="space-y-2 pb-4">
            {#each agents as agent (agent.id)}
              <button
                type="button"
                class={[
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                  selectedAgent === agent.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted border-transparent",
                ]}
                onclick={() => (selectedAgent = selectedAgent === agent.id ? null : agent.id)}
              >
                <div class="relative shrink-0">
                  <div
                    class="flex size-10 items-center justify-center rounded-lg text-white {agent.color}"
                  >
                    <agent.icon class="size-5" />
                  </div>
                  <span
                    class="border-background absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 {agent.status ===
                    'online'
                      ? 'bg-green-500'
                      : agent.status === 'busy'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'}"
                  ></span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate font-medium">{agent.name}</p>
                  </div>
                  <p class="text-muted-foreground truncate text-xs">{agent.role}</p>
                  <p class="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {agent.description}
                  </p>
                </div>
              </button>
            {/each}
          </div>
        </ScrollArea>
      </Card.Content>
    </Card.Root>
  </aside>

  <!-- Center Panel: Chat Interface -->
  <main class="flex min-w-0 flex-1 flex-col gap-4">
    <Card.Root class="flex flex-1 flex-col overflow-hidden">
      <Card.Header class="border-b pb-3">
        <div class="flex items-center gap-3">
          <Avatar.Root class="border-primary/20 size-10 border-2">
            <Avatar.Fallback class="bg-primary text-primary-foreground">
              <BotIcon class="size-5" />
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="flex-1">
            <Card.Title class="text-base">AI Agent Chat</Card.Title>
            <Card.Description class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-green-500"></span>
              General Agent is online
            </Card.Description>
          </div>
        </div>
      </Card.Header>

      <!-- Chat Messages -->
      <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          {#each messages as message (message.id)}
            {#if message.sender === "user"}
              <!-- User Message -->
              <div class="flex items-start justify-end gap-3">
                <div class="max-w-[80%]">
                  <div
                    class="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2"
                  >
                    <p class="text-sm">{message.content}</p>
                  </div>
                  <p class="text-muted-foreground mt-1 text-right text-xs">{message.timestamp}</p>
                </div>
                <Avatar.Root class="size-8 shrink-0">
                  <Avatar.Fallback class="bg-muted text-xs">ME</Avatar.Fallback>
                </Avatar.Root>
              </div>
            {:else}
              <!-- Agent Message -->
              {#each [getAgentById(message.agentId || "general")] as messageAgent}
                <div class="flex items-start gap-3">
                  <div class="relative shrink-0">
                    <div
                      class="flex size-8 items-center justify-center rounded-lg text-white {messageAgent?.color ||
                        'bg-blue-500'}"
                    >
                      {#if messageAgent?.icon}
                        <messageAgent.icon class="size-4" />
                      {/if}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                      <p class="text-primary mb-1 text-xs font-medium">{messageAgent?.name}</p>
                      <p class="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                    <p class="text-muted-foreground mt-1 text-xs">{message.timestamp}</p>

                    <!-- Inline Review Card -->
                    {#if message.type === "review" && message.reviewData}
                      <Card.Root class="border-primary/20 mt-3">
                        <Card.Header class="pb-2">
                          <div class="flex items-center gap-2">
                            {#if message.reviewData.type === "invoice"}
                              <FileTextIcon class="text-muted-foreground size-4" />
                            {:else}
                              <PenToolIcon class="text-muted-foreground size-4" />
                            {/if}
                            <Card.Title class="text-sm">{message.reviewData.title}</Card.Title>
                          </div>
                        </Card.Header>
                        <Card.Content class="pb-3">
                          <div class="bg-muted rounded-md p-3">
                            <p class="text-sm whitespace-pre-line">
                              {message.reviewData.preview}
                            </p>
                          </div>
                          {#if message.reviewData.platforms}
                            <div class="mt-3 flex flex-wrap gap-2">
                              {#each message.reviewData.platforms as platform}
                                <Badge variant="outline" class="gap-1">
                                  {#if platform === "facebook"}
                                    <svg
                                      class="size-3"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      role="img"
                                    >
                                      <title>Facebook</title>
                                      <path d={siFacebook.path} />
                                    </svg>
                                  {:else if platform === "tiktok"}
                                    <svg
                                      class="size-3"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      role="img"
                                    >
                                      <title>TikTok</title>
                                      <path d={siTiktok.path} />
                                    </svg>
                                  {:else if platform === "viber"}
                                    <MessageCircleIcon class="size-3" />
                                  {:else if platform === "telegram"}
                                    <svg
                                      class="size-3"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      role="img"
                                    >
                                      <title>Telegram</title>
                                      <path d={siTelegram.path} />
                                    </svg>
                                  {/if}
                                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                </Badge>
                              {/each}
                            </div>
                          {/if}
                        </Card.Content>
                        <Card.Footer class="flex gap-2 pt-0">
                          <Button
                            size="sm"
                            class="flex-1"
                            onclick={() => handleApprove(message.id)}
                          >
                            <CheckIcon class="mr-1 size-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            class="flex-1"
                            onclick={() => handleReject(message.id)}
                          >
                            <XIcon class="mr-1 size-4" />
                            Reject
                          </Button>
                        </Card.Footer>
                      </Card.Root>
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          {/each}
        </div>
      </div>

      <!-- Input Area -->
      <Card.Footer class="border-t p-4">
        <div class="flex w-full items-end gap-2">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger
                class={buttonVariants({ variant: "ghost", size: "icon", class: "shrink-0" })}
              >
                <PaperclipIcon class="size-5" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Attach file</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
          <Textarea
            placeholder="Type a message or command..."
            class="min-h-[44px] resize-none"
            rows={1}
            bind:value={newMessage}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            size="icon"
            class="shrink-0"
            disabled={!newMessage.trim()}
            onclick={handleSendMessage}
          >
            <SendIcon class="size-4" />
          </Button>
        </div>
      </Card.Footer>
    </Card.Root>
  </main>

  <!-- Right Panel: Task Queue -->
  <aside class="flex w-full flex-col gap-4 md:w-80">
    <Card.Root class="flex-1 overflow-hidden">
      <Card.Header class="pb-3">
        <Card.Title class="text-base">Task Queue</Card.Title>
        <Card.Description>
          {tasks.filter((t) => t.status === "processing").length} active, {tasks.filter(
            (t) => t.status === "pending"
          ).length} pending
        </Card.Description>
      </Card.Header>
      <Card.Content class="p-0">
        <ScrollArea class="h-[calc(100vh-12rem)] px-4">
          <div class="space-y-3 pb-4">
            {#each tasks as task (task.id)}
              {#each [getAgentById(task.agentId)] as taskAgent}
                {#each [getStatusIcon(task.status)] as StatusIcon}
                  <div class="bg-muted/50 hover:bg-muted rounded-lg border p-3 transition-colors">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-start gap-2">
                        <div
                          class="flex size-8 shrink-0 items-center justify-center rounded-md text-white {taskAgent?.color}"
                        >
                          {#if taskAgent?.icon}
                            <taskAgent.icon class="size-4" />
                          {/if}
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium">{task.title}</p>
                          <p class="text-muted-foreground text-xs">{taskAgent?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div class="mt-2 flex items-center justify-between">
                      <Badge variant={getStatusBadgeVariant(task.status)} class="gap-1">
                        <StatusIcon class="size-3" />
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                      <span class="text-muted-foreground text-xs">{task.createdAt}</span>
                    </div>
                  </div>
                {/each}
              {/each}
            {/each}
          </div>
        </ScrollArea>
      </Card.Content>
    </Card.Root>
  </aside>
</div>
