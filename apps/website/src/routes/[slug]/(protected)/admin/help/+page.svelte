<script lang="ts">
  import BotIcon from "@lucide/svelte/icons/bot";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import HelpCircleIcon from "@lucide/svelte/icons/help-circle";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import PackageIcon from "@lucide/svelte/icons/package";
  import RocketIcon from "@lucide/svelte/icons/rocket";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SendIcon from "@lucide/svelte/icons/send";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import ThumbsDownIcon from "@lucide/svelte/icons/thumbs-down";
  import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Separator } from "@repo/ui/separator";
  import * as Sheet from "@repo/ui/sheet";
  import * as Sidebar from "@repo/ui/sidebar";
  import * as Tabs from "@repo/ui/tabs";
  import { fade, fly } from "svelte/transition";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // Type definitions
  type MessageRole = "assistant" | "user";
  interface Message {
    id: string;
    role: MessageRole;
    content: string;
  }

  interface FaqItem {
    id: string;
    category: string;
    question: string;
    answer: string;
  }

  // AI Chat state
  let isChatOpen = $state(false);
  let chatInput = $state("");
  let messages: Message[] = $state([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi there! 👋 I'm your AI assistant. I can help you with anything about your shop - from processing sales to managing inventory. What would you like to know?",
    },
  ]);

  // Mock data for help categories
  const helpCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of using the POS system",
      icon: RocketIcon,
      articleCount: 12,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "products-inventory",
      title: "Products & Inventory",
      description: "Manage your product catalog and stock",
      icon: PackageIcon,
      articleCount: 24,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "sales-payments",
      title: "Sales & Payments",
      description: "Process transactions and manage payments",
      icon: CreditCardIcon,
      articleCount: 18,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      id: "account-settings",
      title: "Account & Settings",
      description: "Manage your account and preferences",
      icon: SettingsIcon,
      articleCount: 15,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  // Smart suggestions based on recent activity
  const smartSuggestions = [
    {
      title: "How to process a refund",
      category: "sales",
      aiRecommended: true,
      reason: "Based on your recent transactions",
    },
    {
      title: "Setting up tax rates",
      category: "settings",
      aiRecommended: false,
    },
    {
      title: "Managing inventory alerts",
      category: "inventory",
      aiRecommended: true,
      reason: "You have 3 products low in stock",
    },
  ];

  // FAQ items organized by category
  const faqItems: FaqItem[] = [
    {
      id: "refund-process",
      category: "general",
      question: "How do I process a refund?",
      answer:
        "To process a refund, navigate to the order history, select the order, and click 'Process Refund'. You can issue full or partial refunds depending on your policy.",
    },
    {
      id: "custom-receipts",
      category: "general",
      question: "Can I customize my receipts?",
      answer:
        "Yes! Go to Settings > Receipt to customize what information appears on your receipts, including your logo, business details, and footer text. You can preview changes in real-time.",
    },
    {
      id: "add-team",
      category: "general",
      question: "How do I add team members?",
      answer:
        "Navigate to Settings > Team and click 'Invite Member'. Enter their email address and select their role (Owner, Manager, or Cashier). They'll receive an invitation email.",
    },
    {
      id: "billing-cycle",
      category: "billing",
      question: "When will I be billed?",
      answer:
        "Your billing cycle starts on the day you subscribe. You'll be charged monthly on the same date. You can view upcoming charges in Settings > Billing.",
    },
    {
      id: "cancel-subscription",
      category: "billing",
      question: "How do I cancel my subscription?",
      answer:
        "Go to Settings > Billing and click 'Cancel Subscription'. Your access will continue until the end of your current billing period. You can export your data anytime.",
    },
    {
      id: "payment-methods",
      category: "billing",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.",
    },
    {
      id: "data-export",
      category: "technical",
      question: "Can I export my data?",
      answer:
        "Yes! You can export your sales, inventory, and customer data in CSV or Excel format. Go to Reports > Export and select the data range and format.",
    },
    {
      id: "offline-mode",
      category: "technical",
      question: "Does the POS work offline?",
      answer:
        "Yes! The POS works offline and syncs automatically when you're back online. All transactions made offline are queued and processed once connectivity is restored.",
    },
    {
      id: "contact-support",
      category: "contact",
      question: "How do I contact support?",
      answer:
        "You can reach us via email at support@example.com, live chat (available 9 AM - 6 PM EST), or use the AI assistant for instant help with most questions.",
    },
  ];

  let activeFaqTab = $state("general");
  let searchQuery = $state("");
  let openFaqId = $state<string | null>(null);

  function toggleFaq(id: string) {
    openFaqId = openFaqId === id ? null : id;
  }

  function openAiChat(context?: string) {
    isChatOpen = true;
    if (context) {
      messages = [
        ...messages,
        {
          id: Date.now().toString(),
          role: "user",
          content: `I'm looking for help with ${context}`,
        },
      ];
      // Simulate AI response
      setTimeout(() => {
        messages = [
          ...messages,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I'd be happy to help you with ${context}! What specific question do you have about this topic?`,
          },
        ];
      }, 500);
    }
  }

  function sendMessage() {
    if (!chatInput.trim()) return;

    messages = [
      ...messages,
      {
        id: Date.now().toString(),
        role: "user",
        content: chatInput,
      },
    ];

    const userQuestion = chatInput;
    chatInput = "";

    // Simulate AI response
    setTimeout(() => {
      messages = [
        ...messages,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Thanks for asking! This is a simulated response. In the real implementation, the AI would analyze your question "${userQuestion}" and provide a helpful, contextual answer based on the documentation.`,
        },
      ];
    }, 1000);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const filteredFaqs = $derived(
    faqItems.filter(
      (faq) =>
        faq.category === activeFaqTab &&
        (searchQuery === "" ||
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <!-- Header with Breadcrumb -->
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${shop.slug}/admin`}>Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Help & Support</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </div>
  </div>

  <Separator />

  <!-- Hero Section with AI Search -->
  <div class="flex flex-col items-center gap-6 py-8 text-center md:py-12">
    <div class="flex flex-col items-center gap-2">
      <div class="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
        <HelpCircleIcon class="text-primary size-8" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">How can we help you today?</h1>
      <p class="text-muted-foreground max-w-md">
        Search our documentation or ask our AI assistant for instant help
      </p>
    </div>

    <div class="relative w-full max-w-2xl">
      <div class="relative">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Describe your question or issue..."
          class="h-14 rounded-xl pr-32 pl-12 text-base shadow-sm"
          bind:value={searchQuery}
        />
        <Button
          class="absolute top-1/2 right-2 -translate-y-1/2 gap-2"
          onclick={() => openAiChat(searchQuery)}
        >
          <BotIcon class="size-4" />
          Ask AI
        </Button>
      </div>
      <p class="text-muted-foreground mt-2 text-sm">
        Press Enter to search or click "Ask AI" for conversational help
      </p>
    </div>
  </div>

  <!-- Smart Suggestions -->
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <SparklesIcon class="size-6 shrink-0 text-amber-500" />
      <div>
        <h2 class="text-left text-lg font-semibold">Suggested for you</h2>
        <span class="text-muted-foreground text-sm">(AI-powered based on your activity)</span>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each smartSuggestions as suggestion}
        <button
          type="button"
          class="hover:bg-accent group flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
          onclick={() => openAiChat(suggestion.title)}
        >
          <div class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FileTextIcon class="text-primary size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-medium">{suggestion.title}</p>
              {#if suggestion.aiRecommended}
                <span
                  class="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600"
                >
                  AI
                </span>
              {/if}
            </div>
            {#if suggestion.aiRecommended && suggestion.reason}
              <p class="text-muted-foreground text-xs">{suggestion.reason}</p>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <Separator />

  <!-- Category Cards -->
  <div class="flex flex-col gap-3">
    <h2 class="text-lg font-semibold">Browse by Category</h2>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each helpCategories as category}
        <Card.Root
          class="group hover:border-primary/50 cursor-pointer py-4 transition-colors"
          onclick={() => openAiChat(category.title)}
        >
          <Card.Content class="flex items-center gap-3 p-0 px-4">
            <div
              class="{category.color} flex size-10 shrink-0 items-center justify-center rounded-lg"
            >
              <category.icon class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Card.Title class="text-sm font-medium">{category.title}</Card.Title>
              </div>
              <Card.Description class="line-clamp-1 text-xs">
                {category.articleCount} articles · {category.description}
              </Card.Description>
            </div>
            <BotIcon
              class="text-muted-foreground group-hover:text-primary size-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </div>

  <Separator />

  <!-- FAQ Section -->
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">Frequently Asked Questions</h2>

    <Tabs.Root bind:value={activeFaqTab} class="w-full">
      <Tabs.List class="bg-muted inline-flex h-auto w-full flex-wrap gap-1 p-1 sm:w-auto">
        <Tabs.Trigger value="general" class="data-[state=active]:bg-background"
          >General</Tabs.Trigger
        >
        <Tabs.Trigger value="billing" class="data-[state=active]:bg-background"
          >Billing</Tabs.Trigger
        >
        <Tabs.Trigger value="technical" class="data-[state=active]:bg-background"
          >Technical</Tabs.Trigger
        >
        <Tabs.Trigger value="contact" class="data-[state=active]:bg-background"
          >Contact</Tabs.Trigger
        >
      </Tabs.List>

      {#each ["general", "billing", "technical", "contact"] as category}
        <Tabs.Content value={category} class="mt-6">
          <div class="flex flex-col gap-3">
            {#each filteredFaqs as faq}
              <div class="rounded-lg border">
                <button
                  type="button"
                  class="hover:bg-accent/50 flex w-full items-center justify-between p-4 text-left"
                  onclick={() => toggleFaq(faq.id)}
                >
                  <span class="font-medium">{faq.question}</span>
                  <ChevronDownIcon
                    class="text-muted-foreground size-5 shrink-0 transition-transform {openFaqId ===
                    faq.id
                      ? 'rotate-180'
                      : ''}"
                  />
                </button>
                {#if openFaqId === faq.id}
                  <div class="border-t px-4 pb-4" transition:fade={{ duration: 200 }}>
                    <p class="text-muted-foreground mt-4">{faq.answer}</p>
                    <div class="mt-4 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        class="text-muted-foreground hover:text-foreground gap-2"
                        onclick={() => openAiChat(faq.question)}
                      >
                        <BotIcon class="size-4" />
                        Ask follow-up
                      </Button>
                      <span class="text-muted-foreground text-sm">Was this helpful?</span>
                      <Button variant="ghost" size="icon" class="size-8">
                        <ThumbsUpIcon class="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" class="size-8">
                        <ThumbsDownIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </Tabs.Content>
      {/each}
    </Tabs.Root>

    <!-- Can't find section -->
    <Card.Root class="mt-6 border-dashed">
      <Card.Content class="flex flex-col items-center gap-4 py-8 text-center">
        <div class="bg-muted flex size-12 items-center justify-center rounded-full">
          <MessageCircleIcon class="text-muted-foreground size-6" />
        </div>
        <div>
          <h3 class="font-medium">Can't find what you're looking for?</h3>
          <p class="text-muted-foreground text-sm">
            Our AI assistant can help you find answers instantly
          </p>
        </div>
        <div class="flex gap-3">
          <Button onclick={() => openAiChat()} class="gap-2">
            <BotIcon class="size-4" />
            Ask AI Assistant
          </Button>
          <Button variant="outline">Contact Support</Button>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</section>

<!-- Floating AI Widget -->
<div class="fixed right-4 bottom-4 z-50">
  {#if !isChatOpen}
    <button
      type="button"
      class="bg-primary text-primary-foreground hover:bg-primary/90 flex size-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105"
      onclick={() => (isChatOpen = true)}
      aria-label="Open AI Assistant"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <BotIcon class="size-7" />
    </button>
  {/if}
</div>

<!-- AI Chat Sheet -->
<Sheet.Root bind:open={isChatOpen}>
  <Sheet.Content side="right" class="flex w-full flex-col px-4 pb-2 sm:max-w-md">
    <Sheet.Header class="border-b pb-4">
      <div class="flex items-center gap-3">
        <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
          <BotIcon class="text-primary size-6" />
        </div>
        <div>
          <Sheet.Title>AI Assistant</Sheet.Title>
          <Sheet.Description>Ask me anything about your shop</Sheet.Description>
        </div>
      </div>
    </Sheet.Header>

    <!-- Chat Messages -->
    <div class="flex-1 overflow-y-auto py-4">
      <div class="flex flex-col gap-4">
        {#each messages as message (message.id)}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2.5 {message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'}"
            >
              {#if message.role === "assistant"}
                <div class="mb-1 flex items-center gap-1.5">
                  <BotIcon class="size-3.5" />
                  <span class="text-xs font-medium">Assistant</span>
                </div>
              {/if}
              <p class="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Quick Actions -->
    {#if messages.length === 1}
      <div class="border-t pt-3">
        <p class="text-muted-foreground mb-2 text-xs font-medium">Quick actions:</p>
        <div class="scrollbar-hide flex gap-2 overflow-x-auto">
          {#each ["Process a refund", "Add a product", "View reports", "Update settings"] as action}
            <button
              type="button"
              class="bg-secondary hover:bg-secondary/80 flex-shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors"
              onclick={() => {
                chatInput = action;
                sendMessage();
              }}
            >
              {action}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Input Area -->
    <div>
      <div class="flex gap-2">
        <Input
          placeholder="Type your question..."
          class="flex-1"
          bind:value={chatInput}
          onkeydown={handleKeydown}
        />
        <Button size="icon" onclick={sendMessage} disabled={!chatInput.trim()}>
          <SendIcon class="size-4" />
        </Button>
      </div>
      <p class="text-muted-foreground mt-2 text-center text-xs">
        AI responses are generated based on your shop's documentation
      </p>
    </div>
  </Sheet.Content>
</Sheet.Root>
