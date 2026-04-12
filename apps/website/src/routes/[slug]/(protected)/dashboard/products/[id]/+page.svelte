<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import BarcodeIcon from "@lucide/svelte/icons/barcode";
  import BoxIcon from "@lucide/svelte/icons/box";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import StoreIcon from "@lucide/svelte/icons/store";
  import TagIcon from "@lucide/svelte/icons/tag";
  import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
  import TruckIcon from "@lucide/svelte/icons/truck";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Alert from "@repo/ui/alert";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Separator from "@repo/ui/separator";
  import * as Tabs from "@repo/ui/tabs";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import StockAdjustmentDialog from "$lib/components/StockAdjustmentDialog.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { productDetailTabSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const searchParams = useSearchParams(productDetailTabSchema);

  const productQuery = createQuery(() =>
    orpc.products.get.queryOptions({
      input: { slug: params.slug, id: params.id },
    })
  );

  const product = $derived(productQuery.data);

  const suppliersQuery = createQuery(() =>
    orpc.products.getSuppliers.queryOptions({
      input: { slug: params.slug, productId: params.id },
      enabled: searchParams.tab === "overview" && !!product,
    })
  );

  const invoiceHistoryQuery = createQuery(() =>
    orpc.products.getInvoiceHistory.queryOptions({
      input: { slug: params.slug, productId: params.id, pageSize: 5 },
      enabled: searchParams.tab === "overview" && !!product,
    })
  );

  const movementsQuery = createInfiniteQuery(() =>
    orpc.inventory.listMovements.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        slug: params.slug,
        productId: params.id,
        cursor,
        pageSize: 20,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: searchParams.tab === "inventory" && !!product,
    })
  );

  const orderHistoryQuery = createInfiniteQuery(() =>
    orpc.products.getOrderHistory.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        slug: params.slug,
        productId: params.id,
        cursor,
        pageSize: 20,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: searchParams.tab === "history" && !!product,
    })
  );

  const hasLowStock = $derived(
    product && product.lowStockThreshold != null ? product.stock < product.lowStockThreshold : false
  );

  const mostRecentUnitCost = $derived(invoiceHistoryQuery.data?.mostRecentUnitCost ?? null);

  const hasPricingWarning = $derived(() => {
    if (!mostRecentUnitCost || !product) return false;
    return product.priceCents < mostRecentUnitCost;
  });

  const allMovements = $derived(movementsQuery.data?.pages.flatMap((p) => p.items) ?? []);
  const allOrders = $derived(orderHistoryQuery.data?.pages.flatMap((p) => p.items) ?? []);
  const totalRevenue = $derived(orderHistoryQuery.data?.pages[0]?.totalRevenue ?? 0);
  const totalUnitsSold = $derived(orderHistoryQuery.data?.pages[0]?.totalUnitsSold ?? 0);

  let showAdjustDialog = $state(false);

  type MovementType = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "WASTAGE" | "CORRECTION";

  function getMovementBadgeVariant(
    type: MovementType
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case "PURCHASE":
        return "secondary";
      case "SALE":
        return "secondary";
      case "RETURN":
        return "outline";
      case "ADJUSTMENT":
        return "outline";
      case "WASTAGE":
        return "destructive";
      default:
        return "outline";
    }
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}/dashboard` },
      { label: "Products", href: `/${params.slug}/dashboard/products` },
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
          href={`/${params.slug}/dashboard/products/${params.id}/edit`}
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
    <section class="space-y-4">
      <div class="bg-card relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        {#if product.image}
          <img src={product.image} alt={product.name} class="h-full w-full object-cover" />
        {:else}
          <div class="flex h-full items-center justify-center">
            <PackageIcon class="text-muted-foreground/50 size-20" />
          </div>
        {/if}
      </div>

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

      {#if hasPricingWarning()}
        <Alert.Root variant="destructive">
          <AlertTriangleIcon />
          <Alert.Title>Pricing Warning</Alert.Title>
          <Alert.Description>
            Selling price ({(product.priceCents / 100).toFixed(2)}) is below the most recent
            supplier cost ({(mostRecentUnitCost! / 100).toFixed(2)}).
          </Alert.Description>
        </Alert.Root>
      {/if}

      <Card.Root>
        <Card.Header class="pb-3">
          <Card.Title class="text-xl">{product.name}</Card.Title>
          <div class="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <span class="text-foreground font-medium">
              <Pricing cents={product.priceCents} priceClass="text-lg font-semibold" />
            </span>
            <span>•</span>
            <span
              class={product.lowStockThreshold != null && product.stock < product.lowStockThreshold
                ? "text-destructive font-medium"
                : "text-muted-foreground"}
            >
              {product.stock} in stock
            </span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each product.categories as category}
              <Badge variant="secondary">
                {category.name}
              </Badge>
            {/each}
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-muted-foreground flex flex-col gap-1 text-sm">
            <div class="flex items-center gap-2">
              <TagIcon class="size-4" />
              <span>SKU: {product.sku}</span>
            </div>
            {#if product.barcode}
              <div class="flex items-center gap-2">
                <BarcodeIcon class="size-4" />
                <span>Barcode: {product.barcode}</span>
              </div>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    </section>

    <Tabs.Root bind:value={searchParams.tab} class="flex-1">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="inventory">Inventory</Tabs.Trigger>
        <Tabs.Trigger value="history">History</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" class="mt-4 space-y-4">
        {#if product.description}
          <Card.Root>
            <Card.Header class="pb-3">
              <Card.Title class="text-muted-foreground text-sm font-medium">Description</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-foreground text-sm leading-relaxed">{product.description}</p>
            </Card.Content>
          </Card.Root>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <Card.Root>
            <Card.Content class="p-4">
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <DollarSignIcon class="text-primary size-5" />
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">Total Revenue</p>
                  <p class="text-foreground text-lg font-semibold">
                    <Pricing cents={totalRevenue} />
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root>
            <Card.Content class="p-4">
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <ShoppingCartIcon class="text-primary size-5" />
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">Units Sold</p>
                  <p class="text-foreground text-lg font-semibold">{totalUnitsSold}</p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <StoreIcon class="size-4" />
              Suppliers
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            {#if suppliersQuery.isLoading}
              <div class="flex items-center justify-center py-4">
                <Loader2Icon class="text-muted-foreground size-5 animate-spin" />
              </div>
            {:else if suppliersQuery.isError}
              <p class="text-muted-foreground py-4 text-center text-sm">Failed to load suppliers</p>
            {:else if suppliersQuery.data?.items.length === 0}
              <p class="text-muted-foreground py-4 text-center text-sm">No suppliers found</p>
            {:else}
              {#each suppliersQuery.data?.items ?? [] as supplier}
                {#if supplier.name}
                  <div class="flex items-start justify-between rounded-lg border p-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="text-foreground font-medium">{supplier.name}</p>
                        {#if supplier.isPreferred}
                          <Badge>Preferred</Badge>
                        {/if}
                      </div>
                      {#if supplier.contactName}
                        <p class="text-muted-foreground mt-1 text-sm">{supplier.contactName}</p>
                      {/if}
                      {#if supplier.phone}
                        <p class="text-muted-foreground text-xs">{supplier.phone}</p>
                      {/if}
                      {#if supplier.phone2}
                        <p class="text-muted-foreground text-xs">{supplier.phone2}</p>
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="pb-3">
            <Card.Title class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <FileTextIcon class="size-4" />
              Recent Invoices
            </Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-col gap-3">
            {#if invoiceHistoryQuery.isLoading}
              <div class="flex items-center justify-center py-4">
                <Loader2Icon class="text-muted-foreground size-5 animate-spin" />
              </div>
            {:else if invoiceHistoryQuery.isError}
              <p class="text-muted-foreground py-4 text-center text-sm">Failed to load invoices</p>
            {:else if invoiceHistoryQuery.data?.items.length === 0}
              <p class="text-muted-foreground py-4 text-center text-sm">No invoices found</p>
            {:else}
              {#each invoiceHistoryQuery.data?.items ?? [] as invoice}
                <div class="flex items-center justify-between rounded-lg border p-3">
                  <div class="flex items-center gap-3">
                    <div class="bg-muted flex size-10 items-center justify-center rounded-lg">
                      <FileTextIcon class="text-muted-foreground size-5" />
                    </div>
                    <div>
                      <p class="text-foreground font-medium">{invoice.invoiceNumber ?? "N/A"}</p>
                      <p class="text-muted-foreground text-sm">
                        {invoice.supplierName ?? "Unknown"}
                      </p>
                      <p class="text-muted-foreground text-xs">
                        {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-foreground font-medium">
                      <Pricing cents={invoice.lineTotalCents} />
                    </p>
                    <p class="text-muted-foreground text-xs">{invoice.qty} units</p>
                  </div>
                </div>
              {/each}
            {/if}
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="inventory" class="mt-4 space-y-3">
        {#if movementsQuery.isLoading}
          <div class="flex items-center justify-center py-12">
            <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
          </div>
        {:else if movementsQuery.isError}
          <div class="flex items-center justify-center py-12">
            <p class="text-red-500">Failed to load inventory movements</p>
          </div>
        {:else if allMovements.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
              <BoxIcon class="text-muted-foreground size-6" />
            </div>
            <p class="text-muted-foreground">No inventory movements found</p>
          </div>
        {:else}
          {#each allMovements as movement}
            <Card.Root>
              <Card.Content class="p-4">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    {#if movement.movementType === "PURCHASE"}
                      <TruckIcon class="text-primary size-5" />
                    {:else if movement.movementType === "SALE"}
                      <ShoppingCartIcon class="text-primary size-5" />
                    {:else if movement.movementType === "RETURN"}
                      <TrendingDownIcon class="text-muted-foreground size-5" />
                    {:else}
                      <BoxIcon class="text-muted-foreground size-5" />
                    {/if}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <Badge variant={getMovementBadgeVariant(movement.movementType)}>
                        {movement.movementType}
                      </Badge>
                      <Badge variant={movement.qty > 0 ? "secondary" : "destructive"}>
                        {movement.qty > 0 ? "+" : ""}{movement.qty}
                      </Badge>
                    </div>
                    {#if movement.reason}
                      <p class="text-muted-foreground mt-1 text-sm">{movement.reason}</p>
                    {/if}
                    <div class="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                      <CalendarIcon class="size-3" />
                      <span>{formatDate(movement.occurredAt, true)}</span>
                    </div>
                    {#if movement.movementType === "SALE" || movement.movementType === "RETURN"}
                      {#if movement.unitPriceCents}
                        <p class="text-muted-foreground mt-1 text-xs">
                          <Pricing cents={movement.unitPriceCents} />
                        </p>
                      {/if}
                    {:else if movement.unitCostCents}
                      <p class="text-muted-foreground mt-1 text-xs">
                        <Pricing cents={movement.unitCostCents} />
                      </p>
                    {/if}
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}

          {#if movementsQuery.hasNextPage}
            <div class="mt-4 flex justify-center">
              <Button
                variant="outline"
                onclick={() => movementsQuery.fetchNextPage()}
                disabled={movementsQuery.isFetchingNextPage}
              >
                {#if movementsQuery.isFetchingNextPage}
                  <Loader2Icon class="mr-2 size-4 animate-spin" />
                  Loading...
                {:else}
                  Load More
                {/if}
              </Button>
            </div>
          {/if}
        {/if}
      </Tabs.Content>

      <Tabs.Content value="history" class="mt-4 space-y-3">
        {#if orderHistoryQuery.isLoading}
          <div class="flex items-center justify-center py-12">
            <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
          </div>
        {:else if orderHistoryQuery.isError}
          <div class="flex items-center justify-center py-12">
            <p class="text-red-500">Failed to load order history</p>
          </div>
        {:else if allOrders.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
              <ShoppingCartIcon class="text-muted-foreground size-6" />
            </div>
            <p class="text-muted-foreground">No order history found</p>
          </div>
        {:else}
          {#each allOrders as order}
            <Card.Root>
              <Card.Content class="p-4">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    <UserIcon class="text-primary size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <p class="text-foreground font-medium">{order.customerName ?? "Unknown"}</p>
                      <Badge variant="secondary">
                        {order.qty} units
                      </Badge>
                    </div>
                    {#if order.customerPhone}
                      <p class="text-muted-foreground mt-1 text-sm">{order.customerPhone}</p>
                    {/if}
                    <div class="mt-2 flex items-center justify-between">
                      <div class="text-muted-foreground flex items-center gap-2 text-xs">
                        <CalendarIcon class="size-3" />
                        <span>{formatDate(order.createdAt, true)}</span>
                      </div>
                      <p class="text-foreground font-semibold">
                        <Pricing cents={order.lineTotalCents} />
                      </p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}

          {#if orderHistoryQuery.hasNextPage}
            <div class="mt-4 flex justify-center">
              <Button
                variant="outline"
                onclick={() => orderHistoryQuery.fetchNextPage()}
                disabled={orderHistoryQuery.isFetchingNextPage}
              >
                {#if orderHistoryQuery.isFetchingNextPage}
                  <Loader2Icon class="mr-2 size-4 animate-spin" />
                  Loading...
                {:else}
                  Load More
                {/if}
              </Button>
            </div>
          {/if}

          <Card.Root class="bg-muted border shadow-none">
            <Card.Content class="p-4">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground text-sm">Total Orders</span>
                <span class="text-foreground font-semibold">{allOrders.length}</span>
              </div>
              <Separator.Root class="my-3" />
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground text-sm">Total Revenue</span>
                <span class="text-foreground font-semibold">
                  <Pricing cents={totalRevenue} priceClass="text-lg" />
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      </Tabs.Content>
    </Tabs.Root>
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
