<script lang="ts">
  import StoreIcon from "@lucide/svelte/icons/store";
  import { CURRENCIES, type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation } from "@tanstack/svelte-query";
  import { goto } from "$app/navigation";
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { orpc } from "$lib/orpc_client";
  import { toast } from "svelte-sonner";

  // /setup reachability is owned by setupGate. The load (see +page.server.ts)
  // supplies needsAccount so the form knows whether to render owner fields.
  let { data } = $props();
  const needsAccount = $derived(data.needsAccount);

  const currencies = CURRENCIES.map((code) => {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "name",
    });
    const name = formatter.formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
    return { value: code, label: `${name} (${code})` };
  });

  const setupMutation = createMutation(() =>
    orpc.setup.create.mutationOptions({
      onSuccess: (data) => {
        // ponytail: redirect target from the mutation result, not needsAccount
        // on the page — the owner was just created in this submit.
        goto(data.needsAccount ? "/signin?setup=1" : "/");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Setup failed");
      },
    }),
  );

  const form = createForm(() => ({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      storeName: "",
      currency: "USD" as CurrencyCode,
    },
    onSubmit: async ({ value }) => {
      setupMutation.mutate({
        storeName: value.storeName,
        currency: value.currency,
        ...(needsAccount ? { name: value.name, email: value.email, password: value.password } : {}),
      });
    },
  }));
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
  <div class="w-full max-w-lg">
    <div class="mb-6 flex flex-col items-center text-center">
      <div class="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-full">
        <StoreIcon class="text-primary size-6" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">Set up your store</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {PUBLIC_SITE_NAME} runs one store per server. Configure the store below. You can edit these details
        later in settings.
      </p>
    </div>

    <Card.Root>
      <Card.Content class="space-y-6 pt-6">
        <form
          class="space-y-6"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {#if needsAccount}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  needsAccount && !value.trim() ? "Your name is required" : undefined,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Your name *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    autocomplete="name"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>

            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  needsAccount && !value.trim() ? "Email is required" : undefined,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Email *</Label>
                  <Input
                    id={field.name}
                    type="email"
                    value={field.state.value}
                    autocomplete="email"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  needsAccount && value.length < 8
                    ? "Password must be at least 8 characters"
                    : undefined,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Password *</Label>
                  <Input
                    id={field.name}
                    type="password"
                    value={field.state.value}
                    autocomplete="new-password"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                  />
                  <p class="text-muted-foreground text-sm">At least 8 characters.</p>
                  {#if field.state.meta.errors.length}
                    <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>

            <hr class="border-border" />
          {/if}

          <form.Field
            name="storeName"
            validators={{
              onChange: ({ value }) => (value.trim() ? undefined : "Store name is required"),
            }}
          >
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Store Name *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                />
                {#if field.state.meta.errors.length}
                  <p class="text-destructive text-sm">{field.state.meta.errors}</p>
                {/if}
              </div>
            {/snippet}
          </form.Field>

          <form.Field name="currency">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for="store-currency">Currency</Label>
                <Select.Root
                  type="single"
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as CurrencyCode)}
                >
                  <Select.Trigger class="w-full sm:w-[300px]">
                    {currencies.find((c) => c.value === field.state.value)?.label ??
                      "Select currency"}
                  </Select.Trigger>
                  <Select.Content>
                    {#each currencies as curr}
                      <Select.Item value={curr.value}>{curr.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            {/snippet}
          </form.Field>

          <Button disabled={setupMutation.isPending} type="submit" class="w-full">
            {setupMutation.isPending
              ? "Setting up..."
              : needsAccount
                ? "Create owner & store"
                : "Create store"}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
