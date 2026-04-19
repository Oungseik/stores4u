<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import { COUNTRIES, type CountryCode } from "@repo/config";
  import * as Message from "@repo/ui/ai-elements/message";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";
  import * as Reasoning from "@repo/ui/ai-elements/reasoning";
  import * as Tool from "@repo/ui/ai-elements/tool";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { PhoneInput } from "@repo/ui/phone-input";
  import { Loader } from "@repo/ui/prompt-kit/loader";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Select from "@repo/ui/select";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import {
    DefaultChatTransport,
    getToolName,
    isReasoningUIPart,
    isTextUIPart,
    isToolUIPart,
  } from "ai";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { goto } from "$app/navigation";
  import { PUBLIC_DOMAIN } from "$env/static/public";
  import { orpc } from "$lib/orpc_client";
  import { fillFormOutputSchema } from "$lib/types/shop-form";
  import type { ShopFormFields } from "$lib/types/shop-form";
  import { getCountryName } from "$lib/utils";

  let currentStep = $state(1);
  const totalSteps = 2;
  let isSubmitting = $state(false);

  let chat = $derived(
    new Chat({
      transport: new DefaultChatTransport({ api: "/api/ai/shop-setup" }),
      onFinish: async ({ message }) => {
        for (const part of message.parts) {
          if (isToolUIPart(part) && part.state === "output-available" && part.output) {
            const toolName = getToolName(part);
            if (toolName === "fillShopForm") {
              const parsed = fillFormOutputSchema.safeParse(part.output);
              if (parsed.success && parsed.data.success) {
                handleAiFill(parsed.data.fields);
              }
            }
          }
        }
      },
    })
  );

  const step1Schema = z.object({
    name: z.string().min(1, "Shop name is required").max(100),
    slug: z
      .string()
      .min(1, "Slug is required")
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
  });

  const step2Schema = z.object({
    address: z.string().min(1, "Address is required").max(200),
    city: z.string().min(1, "City is required").max(100),
    phone: z.string().min(1, "Phone is required").max(50),
    email: z.email("Invalid email").max(200).optional().or(z.literal("")),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
  });

  const form = createForm(() => ({
    defaultValues: {
      name: "",
      slug: "",
      title: "",
      description: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      state: "",
      zipCode: "",
      country: "" as CountryCode | "",
    },
    onSubmit: async ({ value }) => {
      isSubmitting = true;
      try {
        await createShopMutation.mutateAsync({
          name: value.name,
          slug: value.slug,
          title: value.title || undefined,
          description: value.description || undefined,
          address: value.address,
          city: value.city,
          phone: value.phone,
          email: value.email || undefined,
          state: value.state || undefined,
          zipCode: value.zipCode || undefined,
          country: value.country || undefined,
        });
        goto(`/${value.slug}/dashboard`);
      } catch (error) {
        isSubmitting = false;
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Failed to create shop. Please try again.");
        }
      }
    },
  }));

  const queryClient = useQueryClient();

  const createShopMutation = createMutation(() =>
    orpc.shops.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shops"] });
      },
    })
  );

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(nameValue: string) {
    form.setFieldValue("slug", generateSlug(nameValue));
  }

  function validateStep(step: number): boolean {
    const values = form.state.values;

    if (step === 1) {
      const result = step1Schema.safeParse({
        name: values.name,
        slug: values.slug,
        title: values.title,
        description: values.description,
      });
      form.validateAllFields("change");
      return result.success;
    } else {
      const result = step2Schema.safeParse({
        address: values.address,
        city: values.city,
        phone: values.phone,
        email: values.email,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
      });
      return result.success;
    }
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      currentStep = Math.min(currentStep + 1, totalSteps);
    }
  }

  function prevStep() {
    currentStep = Math.max(currentStep - 1, 1);
  }

  const stepConfig = [
    {
      title: "Shop Identity",
      description: "Tell us about your shop (You can edit later in settings)",
    },
    {
      title: "Contact Information",
      description: "How can customers reach you?",
    },
  ];

  const currentStepConfig = $derived(stepConfig[currentStep - 1]);

  function handleAiFill(fields: ShopFormFields) {
    form.setFieldValue("name", fields.name);
    form.setFieldValue("slug", fields.slug || generateSlug(fields.name));
    if (fields.title) form.setFieldValue("title", fields.title);
    if (fields.description) form.setFieldValue("description", fields.description);
    form.setFieldValue("address", fields.address);
    form.setFieldValue("city", fields.city);
    form.setFieldValue("phone", fields.phone);
    if (fields.email) form.setFieldValue("email", fields.email);
    if (fields.state) form.setFieldValue("state", fields.state);
    if (fields.zipCode) form.setFieldValue("zipCode", fields.zipCode);
    if (fields.country) form.setFieldValue("country", fields.country);
    currentStep = 2;
  }

  let isChatOpen = $state(false);
  let messagesContainer: HTMLDivElement | null = $state(null);
  let textareaRef: HTMLTextAreaElement | null = $state(null);

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

<div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-lg flex-col gap-6">
    <a href="/" class="flex items-center gap-2 self-center font-medium">
      <img src="/logo.svg" class="size-5" alt="logo" />
      <span>{PUBLIC_DOMAIN}</span>
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">{currentStepConfig.title}</Card.Title>
        <Card.Description>{currentStepConfig.description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="space-y-6"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {#if currentStep === 1}
            <div class="space-y-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    z
                      .string()
                      .min(1, "Shop name is required")
                      .max(100)
                      .safeParse(value)
                      .error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Shop Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="text"
                      onblur={field.handleBlur}
                      onchange={(e) => {
                        const v = e.currentTarget.value;
                        field.handleChange(v);
                        handleNameChange(v);
                      }}
                      placeholder="My Awesome Shop"
                      required
                    />
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) =>
                    z
                      .string()
                      .min(1, "Slug is required")
                      .max(100)
                      .regex(
                        /^[a-z0-9-]+$/,
                        "Slug must contain only lowercase letters, numbers, and hyphens"
                      )
                      .safeParse(value)
                      .error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Slug *</Label>
                    <div class="flex items-center gap-2">
                      <span class="text-muted-foreground text-sm">{PUBLIC_DOMAIN}/</span>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        type="text"
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="my-awesome-shop"
                        required
                      />
                    </div>
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field
                name="title"
                validators={{
                  onChange: ({ value }) =>
                    z.string().max(200).optional().safeParse(value).error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Shop Title</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="text"
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="My Awesome Shop - Best Products in Town"
                    />
                    <p class="text-muted-foreground text-xs">
                      The display title shown on your shop page
                    </p>
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field
                name="description"
                validators={{
                  onChange: ({ value }) =>
                    z.string().max(1000).optional().safeParse(value).error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="Tell customers about your shop..."
                      rows={3}
                    />
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>
            </div>
          {:else if currentStep === 2}
            <div class="space-y-4">
              <form.Field
                name="address"
                validators={{
                  onChange: ({ value }) =>
                    z
                      .string()
                      .min(1, "Address is required")
                      .max(200)
                      .safeParse(value)
                      .error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Address *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="text"
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="123 Main Street"
                      required
                    />
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field
                name="city"
                validators={{
                  onChange: ({ value }) =>
                    z
                      .string()
                      .min(1, "City is required")
                      .max(100)
                      .safeParse(value)
                      .error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>City *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="text"
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="New York"
                      required
                    />
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) =>
                    z
                      .string()
                      .min(1, "Phone is required")
                      .max(50)
                      .safeParse(value)
                      .error?.issues.at(0)?.message,
                }}
              >
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Phone *</Label>
                    <PhoneInput
                      bind:value={field.state.value}
                      name={field.name}
                      placeholder="+1 234 567 8900"
                      onchange={(e) => {
                        field.handleChange(e.currentTarget.value);
                      }}
                    />
                    {#if field.state.meta.errors.length}
                      <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                    {/if}
                  </div>
                {/snippet}
              </form.Field>

              <form.Field name="email">
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="email"
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="hello@yourshop.com"
                    />
                  </div>
                {/snippet}
              </form.Field>

              <div class="grid grid-cols-2 gap-4">
                <form.Field name="state">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>State</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        type="text"
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="NY"
                      />
                    </div>
                  {/snippet}
                </form.Field>

                <form.Field name="zipCode">
                  {#snippet children(field)}
                    <div class="space-y-2">
                      <Label for={field.name}>ZIP Code</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        type="text"
                        onblur={field.handleBlur}
                        onchange={(e) => field.handleChange(e.currentTarget.value)}
                        placeholder="10001"
                      />
                    </div>
                  {/snippet}
                </form.Field>
              </div>

              <form.Field name="country">
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Label for={field.name}>Country</Label>
                    <Select.Root
                      value={field.state.value}
                      type="single"
                      onValueChange={(value) => field.setValue(value as CountryCode)}
                    >
                      <Select.Trigger class="w-full">
                        <span data-slot="select-value">
                          {field.state.value
                            ? getCountryName(field.state.value)
                            : "Select a country"}
                        </span>
                      </Select.Trigger>
                      <Select.Content>
                        {#each COUNTRIES as countryCode}
                          <Select.Item value={countryCode}>
                            {getCountryName(countryCode)}
                          </Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                  </div>
                {/snippet}
              </form.Field>
            </div>
          {/if}

          <div class="flex gap-3 pt-4">
            {#if currentStep > 1}
              <Button type="button" variant="outline" onclick={prevStep} class="flex-1">
                <ChevronLeftIcon class="size-4" />
                Previous
              </Button>
            {/if}

            {#if currentStep < totalSteps}
              <Button type="button" onclick={nextStep} class="flex-1">
                Next
                <ChevronRightIcon class="size-4" />
              </Button>
            {:else}
              <Button disabled={isSubmitting} type="submit" class="flex-1">
                {#if isSubmitting}
                  <Loader2Icon class="animate-spin" />
                {:else}
                  Create Shop
                {/if}
              </Button>
            {/if}
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <p class="text-muted-foreground text-center text-sm">
      Step {currentStep} of {totalSteps}
    </p>
  </div>

  {#if isChatOpen}
    <div
      class="bg-background fixed right-6 bottom-[calc(var(--spacing)*20)] z-50 flex h-[38rem] w-80 flex-col overflow-hidden rounded-xl border shadow-lg sm:w-96"
    >
      <div class="flex items-center gap-3 border-b p-3">
        <div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
          <MessageCircleIcon class="text-primary size-4" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">AI Setup Assistant</p>
          <p class="text-muted-foreground text-xs">Helps you set up your store</p>
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
            <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <MessageCircleIcon class="text-primary size-5" />
            </div>
            <p class="text-muted-foreground text-sm">
              Tell me about your shop and I'll help you set it up!
            </p>
          </div>
        {/if}
      </ScrollArea>

      <PromptInput.Root onSubmit={handleSubmit} class="mx-auto my-2 w-92">
        <PromptInput.Toolbar>
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
</div>
