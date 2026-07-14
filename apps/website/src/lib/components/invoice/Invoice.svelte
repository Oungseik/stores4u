<script lang="ts" module>
  import type { CurrencyCode } from "@repo/config";

  export interface InvoiceItemData {
    id: string;
    name: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }

  /** Shop + order fields the renderer needs. Constructed by each consumer. */
  export interface InvoiceData {
    title: string;
    logo?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    phone?: string | null;
    email?: string | null;
    orderId: string;
    createdAt: Date | string;
    customerName?: string | null;
    customerPhone?: string | null;
    items: InvoiceItemData[];
    subtotalCents: number;
    discountCents: number;
    vatCents: number;
    totalCents: number;
  }

  export interface InvoiceConfig {
    paperWidth: "58" | "80";
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    footerText: string;
  }

  // Single source for defaults: settings form initial values + order-dialog fallback.
  export const DEFAULT_INVOICE_CONFIG: InvoiceConfig = {
    paperWidth: "80",
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: false,
    footerText: "Thank you for your business!",
  };
</script>

<script lang="ts">
  import { formatDate, formatOrderId, formatPrice } from "$lib/utils";

  let { data, config, currency }: { data: InvoiceData; config: InvoiceConfig; currency: CurrencyCode } = $props();

  // ponytail: disable compact notation on receipts — full amounts always.
  const money = (cents: number) => formatPrice(cents, currency, false);
</script>

<div class="receipt" style="width: {config.paperWidth}mm;">
  {#if config.showLogo && data.logo}
    <img class="logo" src={data.logo} alt="" />
  {/if}
  <div class="center bold">{data.title}</div>
  {#if config.showAddress && (data.address || data.city)}
    {#if data.address}<div class="center">{data.address}</div>{/if}
    <div class="center">
      {data.city ?? ""}{data.state ? `, ${data.state}` : ""}{data.zipCode ? ` ${data.zipCode}` : ""}
    </div>
  {/if}
  {#if config.showPhone && data.phone}
    <div class="center">{data.phone}</div>
  {/if}
  {#if config.showEmail && data.email}
    <div class="center">{data.email}</div>
  {/if}

  <div class="rule"></div>
  <div class="row">
    <span>{formatDate(data.createdAt, true)}</span>
    <span>#{formatOrderId(data.orderId)}</span>
  </div>
  <div class="row">
    <span>Customer</span>
    <span>{data.customerName ?? "Walk-in Customer"}</span>
  </div>
  {#if data.customerPhone}
    <div class="row">
      <span></span>
      <span>{data.customerPhone}</span>
    </div>
  {/if}

  <div class="rule"></div>
  {#each data.items as item (item.id)}
    <div class="item">
      <div class="name">{item.name}</div>
      <div class="row muted">
        <span>×{item.qty} @ {money(item.unitPriceCents)}</span>
        <span>{money(item.lineTotalCents)}</span>
      </div>
    </div>
  {/each}

  <div class="rule"></div>
  <div class="row">
    <span>Subtotal</span>
    <span>{money(data.subtotalCents)}</span>
  </div>
  {#if data.discountCents > 0}
    <div class="row">
      <span>Discount</span>
      <span>−{money(data.discountCents)}</span>
    </div>
  {/if}
  {#if data.vatCents > 0}
    <div class="row">
      <span>VAT</span>
      <span>{money(data.vatCents)}</span>
    </div>
  {/if}
  <div class="row bold">
    <span>Total</span>
    <span>{money(data.totalCents)}</span>
  </div>

  {#if config.footerText.trim()}
    <div class="rule"></div>
    <div class="center muted">{config.footerText}</div>
  {/if}
</div>

<style>
  .receipt {
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 12px;
    line-height: 1.5;
    padding: 8px 10px;
    word-break: break-word;
  }
  .receipt .center {
    text-align: center;
  }
  .receipt .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .receipt .rule {
    height: 1px;
    margin: 6px 0;
    opacity: 0.5;
    background-image: repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px);
  }
  .receipt .muted {
    opacity: 0.7;
  }
  .receipt .bold {
    font-weight: 700;
  }
  .receipt .logo {
    display: block;
    max-width: 50%;
    height: auto;
    margin: 0 auto 4px;
  }
</style>
