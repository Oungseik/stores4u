<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SaveIcon from "@lucide/svelte/icons/save";
  import type { CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Checkbox } from "@repo/ui/checkbox";
  import { Label } from "@repo/ui/label";
  import { RadioGroup, RadioGroupItem } from "@repo/ui/radio-group";
  import { Textarea } from "@repo/ui/textarea";
  import { untrack } from "svelte";

  import Invoice, {
    type InvoiceConfig,
    type InvoiceData,
  } from "$lib/components/invoice/Invoice.svelte";

  type InvoiceShopDetails = Pick<
    InvoiceData,
    | "shopName"
    | "description"
    | "logo"
    | "address"
    | "city"
    | "state"
    | "zipCode"
    | "phone"
    | "email"
  >;

  let {
    initialConfig,
    currency,
    shopDetails,
    saving = false,
    onsave,
  }: {
    initialConfig: InvoiceConfig;
    currency: CurrencyCode;
    shopDetails: InvoiceShopDetails;
    saving?: boolean;
    onsave: (config: InvoiceConfig) => void | Promise<void>;
  } = $props();

  // Draft state seeded once at mount. Parent only mounts this after settings
  // have loaded, so initialConfig already reflects the saved row (or defaults).
  // untrack: we deliberately capture only the initial value; user edits drive
  // config thereafter, and a refetch must not clobber them.
  let config = $state<InvoiceConfig>(untrack(() => ({ ...initialConfig })));

  // Real shop header + representative order data.
  const previewData = $derived<InvoiceData>({
    ...shopDetails,
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
  });
</script>

<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
  <!-- Config controls -->
  <Card.Root class="w-full max-w-96 shrink-0">
    <Card.Header>
      <Card.Title class="text-base">{msg.ui_invoice_layout()}</Card.Title>
      <Card.Description>{msg.ui_controls_what_appears_on_generated_invoices()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5">
      <div class="space-y-2">
        <p class="text-sm font-medium">{msg.ui_paper_width()}</p>
        <RadioGroup
          class="flex gap-4"
          value={config.paperWidth}
          onValueChange={(v) => (config.paperWidth = v as "58" | "80")}
        >
          <div class="flex items-center gap-2">
            <RadioGroupItem id="paper-width-58" value="58" />
            <Label for="paper-width-58">58mm</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem id="paper-width-80" value="80" />
            <Label for="paper-width-80">80mm</Label>
          </div>
        </RadioGroup>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">{msg.ui_header_elements()}</p>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showLogo}
            onCheckedChange={(c) => (config.showLogo = c === true)}
          />
          <span class="text-sm">{msg.ui_logo()}</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showAddress}
            onCheckedChange={(c) => (config.showAddress = c === true)}
          />
          <span class="text-sm">{msg.ui_address()}</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showPhone}
            onCheckedChange={(c) => (config.showPhone = c === true)}
          />
          <span class="text-sm">{msg.ui_phone()}</span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={config.showEmail}
            onCheckedChange={(c) => (config.showEmail = c === true)}
          />
          <span class="text-sm">{msg.ui_email()}</span>
        </label>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">{msg.ui_footer_text()}</p>
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
            {msg.ui_saving()}
          {:else}
            <SaveIcon class="size-4" />
            {msg.ui_save_changes()}
          {/if}
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Live preview: same renderer and shop header as order invoices. -->
  <div class="bg-muted/40 flex flex-1 justify-center overflow-x-auto rounded-lg py-4">
    <div class="bg-background shadow-md">
      <Invoice {config} data={previewData} {currency} />
    </div>
  </div>
</div>
