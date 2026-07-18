<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import { type DateValue, parseDate } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import { type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Calendar from "@repo/ui/calendar";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import * as Popover from "@repo/ui/popover";
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

  // invoiceDate is a YYYY-MM-DD string (HTML date input format); Calendar needs a DateValue.
  const dateValue = $derived.by(() => {
    if (!invoiceDate) return undefined;
    try {
      return parseDate(invoiceDate);
    } catch {
      return undefined;
    }
  });

  const formattedDate = $derived(
    dateValue
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(dateValue.toDate("UTC"))
      : msg.ui_pick_a_date(),
  );

  function handleDateChange(value: DateValue | undefined) {
    invoiceDate = value ? value.toString() : "";
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{msg.ui_invoice_details()}</Card.Title>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="grid gap-2">
        <Label>{msg.ui_invoice_number()}</Label>
        <Input bind:value={invoiceNumber} placeholder={msg.ui_invoice_number_254500c()} />
      </div>

      <div class="grid gap-2">
        <Label>{msg.ui_invoice_date()}</Label>
        <Popover.Root>
          <Popover.Trigger>
            <Button
              variant="outline"
              class={[
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground",
              ]}
            >
              <CalendarIcon class="size-4" />
              {formattedDate}
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0">
            <Calendar.Calendar
              type="single"
              value={dateValue}
              onValueChange={handleDateChange}
              captionLayout="dropdown"
            />
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>

    <div class="space-y-2 rounded-lg border p-4 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">{msg.ui_subtotal()}</span>
        <div class="px-3">{formatPrice(subtotalCents, currency, false)}</div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">{msg.ui_vat()}</span>
        <NumberInput bind:value={vat} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">{msg.ui_discount()}</span>
        <NumberInput bind:value={discount} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">{msg.ui_freight()}</span>
        <NumberInput bind:value={freight} class="w-32 text-right" fraction={2} min={0} />
      </div>

      <Separator />

      <div class="flex items-center justify-between">
        <span class="font-semibold">{msg.ui_total()}</span>
        <div class="px-3">{formatPrice(totalCents, currency, false)}</div>
      </div>
    </div>

    <div class="grid gap-2">
      <Label for="notes">{msg.ui_notes()}</Label>
      <Textarea id="notes" bind:value={notes} placeholder={msg.ui_add_any_additional_notes()} />
    </div>
  </Card.Content>
</Card.Root>
