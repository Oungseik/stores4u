<script lang="ts">
  import { type CurrencyCode } from "@repo/config";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";

  import { formatPrice } from "$lib/utils";

  let {
    invoiceNumber = $bindable(""),
    invoiceDate = $bindable(""),
    vat = $bindable(0),
    discount = $bindable(0),
    freight = $bindable(0),
    notes = $bindable(""),
    subtotalCents,
    currency,
  }: {
    invoiceNumber?: string;
    invoiceDate?: string;
    vat?: number;
    discount?: number;
    freight?: number;
    notes?: string;
    subtotalCents: number;
    currency: CurrencyCode;
  } = $props();

  const totalCents = $derived(
    subtotalCents + Math.round(vat * 100) - Math.round(discount * 100) + Math.round(freight * 100),
  );
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Invoice Details</Card.Title>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="grid gap-2">
        <Label>Invoice Number</Label>
        <Input bind:value={invoiceNumber} placeholder="Invoice number" />
      </div>

      <div class="grid gap-2">
        <Label>Invoice Date</Label>
        <Input type="date" bind:value={invoiceDate} />
      </div>
    </div>

    <div class="space-y-2 rounded-lg border p-4 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Subtotal</span>
        <div class="px-3">{formatPrice(subtotalCents, currency, false)}</div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">VAT</span>
        <NumberInput bind:value={vat} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Discount</span>
        <NumberInput bind:value={discount} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Freight</span>
        <NumberInput bind:value={freight} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <Separator />

      <div class="flex items-center justify-between">
        <span class="font-semibold">Total</span>
        <div class="px-3">{formatPrice(totalCents, currency, false)}</div>
      </div>
    </div>

    <div class="grid gap-2">
      <Label for="notes">Notes</Label>
      <Textarea id="notes" bind:value={notes} placeholder="Add any additional notes..." />
    </div>
  </Card.Content>
</Card.Root>
