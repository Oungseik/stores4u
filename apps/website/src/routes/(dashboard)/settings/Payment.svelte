<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { CURRENCIES, type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { Separator } from "@repo/ui/separator";
  import { Switch } from "@repo/ui/switch";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  const defaultSettings = {
    currency: "USD",
    acceptCash: true,
    acceptCard: true,
    acceptDigitalWallet: false,
  };

  const paymentForm = createForm(() => ({
    defaultValues: defaultSettings,
    onSubmit: async ({ value }) => {
      console.log("Saving payment settings:", value);
      toast.success(msg.ui_payment_settings_updated());
    },
  }));

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
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <CreditCardIcon class="size-5" />
      {msg.ui_payment_settings()}
    </Card.Title>
    <Card.Description>{msg.ui_configure_accepted_payment_methods_and_currency()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      class="space-y-6"
      onsubmit={(e) => {
        e.preventDefault();
        paymentForm.handleSubmit();
      }}
    >
      <paymentForm.Field name="currency">
        {#snippet children(field)}
          <div class="space-y-2">
            <Label for={field.name}>{msg.ui_default_currency()}</Label>
            <Select.Root
              type="single"
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value)}
            >
              <Select.Trigger class="w-full sm:w-[300px]">
                {currencies.find((c) => c.value === field.state.value)?.label ?? "Select currency"}
              </Select.Trigger>
              <Select.Content>
                {#each currencies as currency}
                  <Select.Item value={currency.value}>{currency.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {/snippet}
      </paymentForm.Field>

      <Separator />

      <div class="space-y-4">
        <h3 class="text-sm font-medium">{msg.ui_accepted_payment_methods()}</h3>
        <div class="space-y-3">
          <paymentForm.Field name="acceptCash">
            {#snippet children(field)}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <Label class="text-base">{msg.ui_cash()}</Label>
                  <p class="text-muted-foreground text-sm">{msg.ui_accept_cash_payments()}</p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </div>
            {/snippet}
          </paymentForm.Field>

          <paymentForm.Field name="acceptCard">
            {#snippet children(field)}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <Label class="text-base">{msg.ui_credit_debit_cards()}</Label>
                  <p class="text-muted-foreground text-sm">
                    {msg.ui_accept_card_payments_via_terminal()}
                  </p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </div>
            {/snippet}
          </paymentForm.Field>

          <paymentForm.Field name="acceptDigitalWallet">
            {#snippet children(field)}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <Label class="text-base">{msg.ui_digital_wallets()}</Label>
                  <p class="text-muted-foreground text-sm">{msg.ui_apple_pay_google_pay_etc()}</p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </div>
            {/snippet}
          </paymentForm.Field>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" class="gap-2">
          <SaveIcon class="size-4" />
          {msg.ui_save_changes()}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
