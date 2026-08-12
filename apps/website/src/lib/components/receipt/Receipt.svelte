<script lang="ts" module>
  import type { CountryCode, CurrencyCode } from "@repo/config";

  export interface ReceiptItemData {
    id: string;
    name: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }

  /** Shop + order fields the renderer needs. Constructed by each consumer. */
  export interface ReceiptData {
    shopName: string;
    description?: string | null;
    logo?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: CountryCode | null;
    phone?: string | null;
    email?: string | null;
    orderId: string;
    createdAt: Date | string;
    customerName?: string | null;
    customerPhone?: string | null;
    items: ReceiptItemData[];
    subtotalCents: number;
    discountCents: number;
    vatCents: number;
    totalCents: number;
  }

  export interface ReceiptConfig {
    paperWidth: "58" | "80";
    showLogo: boolean;
    showAddress: boolean;
    showState: boolean;
    showCountry: boolean;
    showPhone: boolean;
    showEmail: boolean;
    footerText: string;
  }

  // Single source for defaults: settings form initial values + order-dialog fallback.
  export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
    paperWidth: "80",
    showLogo: true,
    showAddress: true,
    showState: true,
    showCountry: true,
    showPhone: true,
    showEmail: false,
    footerText: "Thank you for your business!",
  };
</script>

<script lang="ts">
  import { formatDate, formatOrderId, formatPrice } from "$lib/utils";
  import { receiptAddressLines } from "./receipt-address";

  let {
    data,
    config,
    currency,
    ref = $bindable(null),
  }: {
    data: ReceiptData;
    config: ReceiptConfig;
    currency: CurrencyCode;
    ref?: HTMLDivElement | null;
  } = $props();

  // ponytail: disable compact notation on receipts — full amounts always.
  const money = (cents: number) => formatPrice(cents, currency, false);
  const addressLines = $derived(receiptAddressLines(data, config));
</script>

<div bind:this={ref} class="receipt" data-receipt-print style="width: {config.paperWidth}mm;">
  {#if config.showLogo && data.logo}
    <img class="logo" src={data.logo} alt="" />
  {/if}
  <div class="center bold">{data.shopName}</div>
  {#if data.description}
    <div class="center muted">{data.description}</div>
  {/if}
  {#if addressLines[0]}<div class="center">{addressLines[0]}</div>{/if}
  {#if addressLines[1]}<div class="center">{addressLines[1]}</div>{/if}
  {#if addressLines[2]}<div class="center">{addressLines[2]}</div>{/if}
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
    box-sizing: border-box;
    background: #fff;
    color: #000;
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
    height: 0;
    margin: 6px 0;
    border-top: 1px dashed currentColor;
    opacity: 0.5;
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
