<script lang="ts">
  import StoreIcon from "@lucide/svelte/icons/store";
  import { CURRENCIES, type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { enhance } from "$app/forms";
  import { PUBLIC_SITE_NAME } from "$env/static/public";

  import type { ActionData, PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let submitting = $state(false);

  const currencies = CURRENCIES.map((code) => {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "name",
    });
    const name = formatter.formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
    return { value: code, label: `${name} (${code})` };
  });

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let storeName = $state("");
  let currency = $state<CurrencyCode>("USD");
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
  <div class="w-full max-w-lg">
    <div class="mb-6 flex flex-col items-center text-center">
      <div class="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-full">
        <StoreIcon class="text-primary size-6" />
      </div>
      <h1 class="text-2xl font-semibold tracking-tight">Set up your store</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {PUBLIC_SITE_NAME} runs one store per server. Configure the store below. You can edit these
        details later in settings.
      </p>
    </div>

    <Card.Root>
      <Card.Content class="space-y-6 pt-6">
        <form
          method="POST"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              await update();
              submitting = false;
            };
          }}
          class="space-y-6"
        >
          {#if data.needsAccount}
            <div class="space-y-2">
              <Label for="name">Your name *</Label>
              <Input id="name" name="name" value={name} autocomplete="name" required />
            </div>

            <div class="space-y-2">
              <Label for="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                autocomplete="email"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                autocomplete="new-password"
                minlength={8}
                required
              />
              <p class="text-muted-foreground text-sm">At least 8 characters.</p>
            </div>

            <hr class="border-border" />
          {/if}

          <div class="space-y-2">
            <Label for="store-name">Store Name *</Label>
            <Input id="store-name" name="storeName" value={storeName} required />
          </div>

          <div class="space-y-2">
            <Label for="store-currency">Currency</Label>
            <input type="hidden" name="currency" value={currency} />
            <Select.Root
              type="single"
              value={currency}
              onValueChange={(v) => (currency = v as CurrencyCode)}
            >
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

          {#if form?.message}
            <p class="text-destructive text-sm">{form.message}</p>
          {/if}

          <Button disabled={submitting} type="submit" class="w-full">
            {submitting ? "Setting up..." : data.needsAccount ? "Create owner & store" : "Create store"}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
