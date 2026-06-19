<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import StoreIcon from "@lucide/svelte/icons/store";
  import { CURRENCIES, type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { goto } from "$app/navigation";
  import { PUBLIC_SITE_NAME } from "$env/static/public";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();

  const schema = z.object({
    name: z.string().min(1, "Store name is required").max(100),
    currency: z.enum(CURRENCIES).default("USD"),
  });

  let isSubmitting = $state(false);

  const createShopMutation = createMutation(() => orpc.shops.create.mutationOptions());

  const currencies = CURRENCIES.map((code) => {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "name",
    });
    const parts = formatter.formatToParts(0);
    const name = parts.find((p) => p.type === "currency")?.value ?? code;
    return { value: code, label: `${name} (${code})` };
  });

  let name = $state("");
  let currency = $state<CurrencyCode>("USD");
  let nameError = $state<string | null>(null);

  async function handleSubmit() {
    nameError = schema.shape.name.safeParse(name).error?.issues.at(0)?.message ?? null;
    if (nameError) return;

    isSubmitting = true;
    try {
      await createShopMutation.mutateAsync({ name, currency });
      goto("/");
    } catch (error) {
      isSubmitting = false;
      toast.error(error instanceof Error ? error.message : "Failed to set up store");
    }
  }
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
  <div class="w-full max-w-lg">
    <div class="mb-6 flex flex-col items-center text-center">
      <div class="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-full">
        <StoreIcon class="text-primary size-6" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">Set up your store</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Welcome to {PUBLIC_SITE_NAME}, {data.user.name}. One store runs on this server — configure
        it below. You can edit these details later in settings.
      </p>
    </div>

    <Card.Root>
      <Card.Content class="space-y-6 pt-6">
        <form
          class="space-y-6"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
        >
          <div class="space-y-2">
            <Label for="store-name">Store Name *</Label>
            <Input
              id="store-name"
              value={name}
              type="text"
              oninput={(e) => (name = e.currentTarget.value)}
              placeholder="My Awesome Store"
              required
            />
            {#if nameError}
              <p class="text-destructive text-sm">{nameError}</p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for="store-currency">Currency</Label>
            <Select.Root type="single" value={currency} onValueChange={(v) => (currency = v as CurrencyCode)}>
              <Select.Trigger class="w-full sm:w-[300px]">
                {currencies.find((c) => c.value === currency)?.label ?? "Select currency"}
              </Select.Trigger>
              <Select.Content>
                {#each currencies as curr}
                  <Select.Item value={curr.value}>{curr.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <Button disabled={isSubmitting} type="submit" class="w-full">
            {#if isSubmitting}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Setting up...
            {:else}
              Create Store
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
