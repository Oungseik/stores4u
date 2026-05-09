<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import * as Card from "@repo/ui/card";
  import { createQuery } from "@tanstack/svelte-query";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const orderQuery = createQuery(() =>
    orpc.orders.get.queryOptions({
      input: { slug: params.slug, orderId: params.id },
    })
  );

  const order = $derived(orderQuery.data);

  function formatOrderId(id: string) {
    return id.slice(-8).toUpperCase();
  }

  function getPaymentStatusStyles(status: string) {
    switch (status) {
      case "paid":
        return "text-emerald-600";
      case "pending":
        return "text-amber-600";
      case "refunded":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }
</script>

<div class="flex w-full max-w-2xl flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}` },
      { label: "Orders", href: `/${params.slug}/orders` },
      { label: order ? `Order #${formatOrderId(order.id)}` : "Order Details" },
    ]}
  />

  {#if orderQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if orderQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load order</p>
    </div>
  {:else if order}
    <!-- Order Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        Order #{formatOrderId(order.id)}
      </h1>
      <p class="text-muted-foreground text-sm">
        Placed on {formatDate(order.createdAt, true)}
      </p>
    </div>

    <!-- Order Items -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-base">
          <PackageIcon class="size-4" />
          Order Items
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="rounded-md border text-sm">
          {#each order.items as item, i}
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
                  <p>{item.product?.name ?? "Unknown Product"}</p>
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
          <Card.Title class="text-base">Customer Notes</Card.Title>
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
          Order Summary
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="space-y-1.5 rounded-md border p-2.5 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Subtotal</span>
            {formatPrice(order.subtotalCents, shop.currency)}
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Discount</span>
            {formatPrice(order.discountCents, shop.currency)}
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Shipping (Local pickup)</span>
            {formatPrice(0, shop.currency)}
          </div>
          <div class="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            {formatPrice(order.totalCents, shop.currency)}
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-muted-foreground">Payment Status</span>
            <span class="{getPaymentStatusStyles('paid')} capitalize">paid</span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Customer -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-base">Customer</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex items-center gap-3 rounded-md border p-3 text-sm">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <span class="text-primary text-sm font-semibold">
              {order.customerName?.charAt(0).toUpperCase() ?? "I"}
            </span>
          </div>
          <div>
            <p class="font-medium">{order.customerName ?? "In-store Purchase"}</p>
            <p class="text-muted-foreground text-sm">{order.customerPhone ?? "—"}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
