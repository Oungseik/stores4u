<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SaveIcon from "@lucide/svelte/icons/save";
  import type { CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Checkbox } from "@repo/ui/checkbox";
  import { Textarea } from "@repo/ui/textarea";
  import { untrack } from "svelte";

  import Invoice, {
    type InvoiceConfig,
    type InvoiceData,
  } from "$lib/components/invoice/Invoice.svelte";

  let {
    initialConfig,
    currency,
    saving = false,
    onsave,
  }: {
    initialConfig: InvoiceConfig;
    currency: CurrencyCode;
    saving?: boolean;
    onsave: (config: InvoiceConfig) => void | Promise<void>;
  } = $props();

  // Draft state seeded once at mount. Parent only mounts this after settings
  // have loaded, so initialConfig already reflects the saved row (or defaults).
  // untrack: we deliberately capture only the initial value; user edits drive
  // config thereafter, and a refetch must not clobber them.
  let config = $state<InvoiceConfig>(untrack(() => ({ ...initialConfig })));

  // Static preview data — hardcoded, never live order data.
  const PREVIEW_DATA: InvoiceData = {
    title: "Acme Store",
    logo: null,
    address: "123 Market Street",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    phone: "(555) 010-2030",
    email: "hello@acme.store",
    orderId: "0192f8a1b3c4d5e6",
    createdAt: new Date(),
    customerName: "Jane Doe",
    customerPhone: "(555) 987-6543",
    items: [
      { id: "1", name: "Whole Milk 1L", qty: 2, unitPriceCents: 150, lineTotalCents: 300 },
      { id: "2", name: "Sourdough Loaf", qty: 1, unitPriceCents: 450, lineTotalCents: 450 },
      { id: "3", name: "Free-Range Eggs (6)", qty: 3, unitPriceCents: 200, lineTotalCents: 600 },
    ],
    subtotalCents: 1350,
    discountCents: 100,
    vatCents: 95,
    totalCents: 1345,
  };
</script>

<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
  <!-- Config controls -->
  <Card.Root class="shrink-0 lg:w-72">
    <Card.Header>
      <Card.Title class="text-base">Invoice layout</Card.Title>
      <Card.Description>Controls what appears on generated invoices.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5">
      <div class="space-y-2">
        <p class="text-sm font-medium">Paper width</p>
        <div class="flex gap-2">
          <Button
            size="sm"
            variant={config.paperWidth === "58" ? "default" : "outline"}
            onclick={() => (config.paperWidth = "58")}>58mm</Button
          >
          <Button
            size="sm"
            variant={config.paperWidth === "80" ? "default" : "outline"}
            onclick={() => (config.paperWidth = "80")}>80mm</Button
          >
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">Header elements</p>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showLogo}
            onCheckedChange={(c) => (config.showLogo = c === true)}
          />
          <span class="text-sm">Logo</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showAddress}
            onCheckedChange={(c) => (config.showAddress = c === true)}
          />
          <span class="text-sm">Address</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showPhone}
            onCheckedChange={(c) => (config.showPhone = c === true)}
          />
          <span class="text-sm">Phone</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showEmail}
            onCheckedChange={(c) => (config.showEmail = c === true)}
          />
          <span class="text-sm">Email</span>
        </label>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">Footer text</p>
        <Textarea
          value={config.footerText}
          oninput={(e) => (config.footerText = e.currentTarget.value)}
          rows={2}
        />
      </div>

      <div class="flex justify-end">
        <Button class="gap-2" disabled={saving} onclick={() => onsave(config)}>
          {#if saving}
            <Loader2Icon class="size-4 animate-spin" />
            Saving...
          {:else}
            <SaveIcon class="size-4" />
            Save Changes
          {/if}
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Live preview (static hardcoded data) -->
  <div class="bg-muted/40 flex flex-1 justify-center overflow-x-auto rounded-lg py-4">
    <div class="bg-background shadow-md">
      <Invoice {config} data={PREVIEW_DATA} {currency} />
    </div>
  </div>
</div>
