<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import ImageDownIcon from "@lucide/svelte/icons/image-down";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PrinterIcon from "@lucide/svelte/icons/printer";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import * as Card from "@repo/ui/card";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import { Spinner } from "@repo/ui/spinner";
  import { createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import Invoice, {
    DEFAULT_INVOICE_CONFIG,
    type InvoiceConfig,
    type InvoiceData,
  } from "$lib/components/invoice/Invoice.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate, formatOrderId, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const orderQuery = createQuery(() =>
    orpc.orders.get.queryOptions({
      input: { orderId: params.id },
    }),
  );
  const invoiceSettingsQuery = createQuery(() => orpc.invoice.get.queryOptions({ input: {} }));

  const order = $derived(orderQuery.data);

  const invoiceConfig = $derived<InvoiceConfig>(
    invoiceSettingsQuery.data?.settings
      ? {
          paperWidth: invoiceSettingsQuery.data.settings.paperWidth === "58" ? "58" : "80",
          showLogo: invoiceSettingsQuery.data.settings.showLogo,
          showAddress: invoiceSettingsQuery.data.settings.showAddress,
          showPhone: invoiceSettingsQuery.data.settings.showPhone,
          showEmail: invoiceSettingsQuery.data.settings.showEmail,
          footerText: invoiceSettingsQuery.data.settings.footerText,
        }
      : { ...DEFAULT_INVOICE_CONFIG },
  );

  const invoiceData = $derived<InvoiceData | null>(
    order
      ? {
          shopName: shop.name,
          description: shop.description,
          logo: shop.logo,
          address: shop.address,
          city: shop.city,
          state: shop.state,
          zipCode: shop.zipCode,
          phone: shop.phone,
          email: shop.email,
          orderId: order.id,
          createdAt: order.createdAt,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.product?.name ?? msg.ui_unknown_product(),
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
          })),
          subtotalCents: order.subtotalCents,
          discountCents: order.discountCents,
          vatCents: order.vatCents,
          totalCents: order.totalCents,
        }
      : null,
  );

  let invoiceOpen = $state(false);
  let invoiceElement = $state<HTMLDivElement | null>(null);
  let imageExporting = $state(false);

  async function saveInvoiceImage() {
    if (!invoiceElement || !order) return;

    imageExporting = true;
    try {
      const { saveOrShareInvoiceImage } = await import("$lib/invoice-image");
      await saveOrShareInvoiceImage(invoiceElement, `invoice-${formatOrderId(order.id)}.png`);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error(msg.ui_failed_to_export_invoice_image());
      }
    } finally {
      imageExporting = false;
    }
  }

  function printInvoice() {
    document.body.classList.add("printing-invoice");
    try {
      window.print();
    } finally {
      document.body.classList.remove("printing-invoice");
    }
  }
</script>

<div class="flex w-full flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    hasPageHeading={Boolean(order)}
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_orders(), href: `/orders` },
      { label: order ? `Order #${formatOrderId(order.id)}` : msg.ui_order_details() },
    ]}
  />

  <div class="flex max-w-2xl flex-col gap-6">
    {#if orderQuery.isLoading}
      <div class="flex items-center justify-center py-24">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if orderQuery.isError}
      <div class="flex items-center justify-center py-24">
        <p class="text-red-500">{msg.ui_failed_to_load_order()}</p>
      </div>
    {:else if order}
      <!-- Order Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold tracking-tight">
            Order #{formatOrderId(order.id)}
          </h1>
          <p class="text-muted-foreground text-sm">
            Placed on {formatDate(order.createdAt, true)}
          </p>
        </div>
        <Button variant="outline" class="shrink-0" onclick={() => (invoiceOpen = true)}>
          <ReceiptIcon data-icon="inline-start" />
          {msg.ui_invoice()}
        </Button>
      </div>

      <!-- Order Items -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2 text-base">
            <PackageIcon class="size-4" />
            {msg.ui_order_items()}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="rounded-md border text-sm">
            {#each order.items as item, i (item.id)}
              <div
                class="flex items-center justify-between p-2.5 {i !== order.items.length - 1
                  ? 'border-b'
                  : ''}"
              >
                <div class="flex items-center gap-2.5">
                  <div class="bg-muted flex size-8 items-center justify-center rounded">
                    <PackageIcon class="text-muted-foreground size-4" />
                  </div>
                  <div>
                    <p>{item.product?.name ?? msg.ui_unknown_product()}</p>
                    <p class="text-muted-foreground text-xs">{item.product?.sku ?? "—"}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-xs">x {item.qty}</p>
                  {formatPrice(item.lineTotalCents, shop.currency)}
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Customer Notes -->
      {#if order.notes}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">{msg.ui_customer_notes()}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {order.notes}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- Order Summary -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2 text-base">
            <ReceiptIcon class="size-4" />
            {msg.ui_order_summary()}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="space-y-1.5 rounded-md border p-2.5 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{msg.ui_subtotal()}</span>
              {formatPrice(order.subtotalCents, shop.currency)}
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{msg.ui_discount()}</span>
              {formatPrice(order.discountCents, shop.currency)}
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{msg.ui_shipping_local_pickup()}</span>
              {formatPrice(0, shop.currency)}
            </div>
            <div class="flex justify-between border-t pt-2 font-semibold">
              <span>{msg.ui_total()}</span>
              {formatPrice(order.totalCents, shop.currency)}
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">{msg.ui_payment_status()}</span>
              <span class="text-emerald-600 capitalize">{msg.paid()}</span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Customer -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">{msg.ui_customer()}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="flex items-center gap-3 rounded-md border p-3 text-sm">
            <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <span class="text-primary text-sm font-semibold">
                {order.customerName?.charAt(0).toUpperCase() ?? "I"}
              </span>
            </div>
            <div>
              <p class="font-medium">{order.customerName ?? msg.ui_in_store_purchase()}</p>
              <p class="text-muted-foreground text-sm">{order.customerPhone ?? "—"}</p>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</div>

<Dialog.Root bind:open={invoiceOpen}>
  <Dialog.Content data-invoice-print-dialog class="max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Invoice #{formatOrderId(order?.id ?? "")}</Dialog.Title>
      <Dialog.Description>{msg.ui_invoice_export_description()}</Dialog.Description>
    </Dialog.Header>
    {#if invoiceData}
      <div class="bg-muted/40 flex justify-center overflow-x-auto rounded-lg py-4">
        <div class="shadow-md">
          <Invoice
            bind:ref={invoiceElement}
            data={invoiceData}
            config={invoiceConfig}
            currency={shop.currency}
          />
        </div>
      </div>
      <Dialog.Footer>
        <Button
          variant="outline"
          class="w-full sm:w-auto"
          disabled={!invoiceElement || imageExporting}
          onclick={printInvoice}
        >
          <PrinterIcon data-icon="inline-start" />
          {msg.ui_print()}
        </Button>
        <Button
          class="w-full sm:w-auto"
          disabled={!invoiceElement || imageExporting}
          onclick={saveInvoiceImage}
        >
          {#if imageExporting}
            <Spinner data-icon="inline-start" />
            {msg.ui_preparing_image()}
          {:else}
            <ImageDownIcon data-icon="inline-start" />
            {msg.ui_save_or_share_image()}
          {/if}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
