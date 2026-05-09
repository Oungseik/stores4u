<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import * as Alert from "@repo/ui/alert";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { createQuery } from "@tanstack/svelte-query";

  import StockAdjustmentDialog from "$lib/components/StockAdjustmentDialog.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";
  import InventoryTab from "./InventoryTab.svelte";
  import PerformanceMetrics from "./PerformanceMetrics.svelte";
  import ProductHero from "./ProductHero.svelte";

  const { params, data: shop }: PageProps = $props();

  const productQuery = createQuery(() =>
    orpc.products.get.queryOptions({
      input: { slug: params.slug, id: params.id },
    })
  );

  const product = $derived(productQuery.data);

  const statsQuery = createQuery(() =>
    orpc.products.statsProduct.queryOptions({
      input: { slug: params.slug, productId: params.id },
      enabled: !!product,
    })
  );

  const hasLowStock = $derived(
    product && product.lowStockThreshold != null ? product.stock < product.lowStockThreshold : false
  );

  const isOutOfStock = $derived(product ? product.stock <= 0 : false);

  let showAdjustDialog = $state(false);
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}` },
      { label: "Products", href: `/${params.slug}/products` },
      { label: product?.name ?? "Product Details" },
    ]}
  >
    {#snippet actions()}
      {#if product}
        <Button variant="outline" size="sm" onclick={() => (showAdjustDialog = true)}>
          <ArrowUpDownIcon data-icon="inline-start" />
          Adjust Stock
        </Button>
        <a
          href={`/${params.slug}/products/${params.id}/edit`}
          class={buttonVariants({ size: "sm" })}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </a>
      {/if}
    {/snippet}
  </AdminDashboardHeader>

  {#if productQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if productQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load product</p>
    </div>
  {:else if product}
    {#if hasLowStock}
      <Alert.Root
        class="border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100 [&>svg]:text-amber-600"
      >
        <AlertTriangleIcon />
        <Alert.Title>Low Stock Warning</Alert.Title>
        <Alert.Description>
          Only {product.stock} units remaining (below threshold of {product.lowStockThreshold}).
        </Alert.Description>
      </Alert.Root>
    {/if}

    <ProductHero {product} {hasLowStock} {isOutOfStock} currency={shop.currency} />

    <div class="border-t"></div>

    <PerformanceMetrics
      isLoading={statsQuery.isLoading}
      stats={statsQuery.data}
      currency={shop.currency}
    />

    <InventoryTab slug={params.slug} productId={params.id} currency={shop.currency} />
  {/if}

  {#if product}
    <StockAdjustmentDialog
      open={showAdjustDialog}
      onClose={() => (showAdjustDialog = false)}
      slug={params.slug}
      productId={params.id}
      productName={product.name}
      currentStock={product.stock}
    />
  {/if}
</div>
