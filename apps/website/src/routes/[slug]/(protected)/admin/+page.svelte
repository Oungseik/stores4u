<script lang="ts">
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import BotIcon from "@lucide/svelte/icons/bot";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import { buttonVariants } from "@repo/ui/button";
  import { createQuery } from "@tanstack/svelte-query";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug: params.slug, pageSize: 100 },
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(productsQuery.data?.items ?? []);

  const outOfStock = $derived(allProducts.filter((p) => p.stock === 0));
  const lowStock = $derived(allProducts.filter((p) => p.stock > 0 && p.stock <= 10));
  const hasAlerts = $derived(outOfStock.length > 0 || lowStock.length > 0);
</script>

<div class="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
  <div class="flex flex-col gap-6 md:gap-8">
    <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard" }]} />

    <!-- Quick Actions -->
    <div>
      <h2 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Quick actions
      </h2>
      <div class="grid grid-cols-1 gap-3 @lg/main:grid-cols-2">
        <!-- Hero: POS Checkout -->
        <a
          href={`/${params.slug}/admin/checkout`}
          class="group border-border bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-md"
        >
          <div class="relative z-10">
            <div class="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <ScanBarcodeIcon class="text-primary size-6" />
            </div>
            <h3 class="mb-1 text-xl font-semibold">Start Selling</h3>
            <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Process sales with barcode scanner or product search. Fast checkout for your
              customers.
            </p>
          </div>
          <div class="relative z-10 mt-6">
            <span class={buttonVariants({ variant: "default", size: "sm" })}>
              Open Checkout
              <ArrowRightIcon
                class="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
          <div
            class="from-primary/[0.03] absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </a>

        <!-- Hero: AI Agents -->
        <a
          href={`/${params.slug}/admin/agents`}
          class="group border-border bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-all duration-200 hover:shadow-md"
        >
          <div class="relative z-10">
            <div class="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-lg">
              <BotIcon class="text-primary size-6" />
            </div>
            <h3 class="mb-1 text-xl font-semibold">AI Assistants</h3>
            <p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Chat with your AI team — process invoices, manage inventory, draft content, and get
              reports.
            </p>
          </div>
          <div class="relative z-10 mt-6">
            <span class={buttonVariants({ variant: "default", size: "sm" })}>
              Open Agents
              <ArrowRightIcon
                class="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
          <div
            class="from-primary/[0.03] absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
        </a>

        <!-- Secondary: Products -->
        <a
          href={`/${params.slug}/admin/products`}
          class="group border-border bg-card flex flex-col rounded-xl border p-5 transition-all duration-200 hover:shadow-sm"
        >
          <div class="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
            <PackageIcon class="text-muted-foreground size-5" />
          </div>
          <h3 class="mb-0.5 font-medium">Products</h3>
          <p class="text-muted-foreground text-sm">Browse & manage your inventory</p>
        </a>

        <!-- Secondary: Orders -->
        <a
          href={`/${params.slug}/admin/orders`}
          class="group border-border bg-card flex flex-col rounded-xl border p-5 transition-all duration-200 hover:shadow-sm"
        >
          <div class="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
            <ShoppingCartIcon class="text-muted-foreground size-5" />
          </div>
          <h3 class="mb-0.5 font-medium">Orders</h3>
          <p class="text-muted-foreground text-sm">View recent transactions</p>
        </a>
      </div>
    </div>

    <!-- Alerts -->
    {#if hasAlerts}
      <div>
        <h2 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Needs attention
        </h2>
        <div class="flex flex-col gap-3">
          {#if outOfStock.length > 0}
            <div>
              <div class="mb-2 flex items-center gap-2">
                <TriangleAlertIcon class="text-destructive size-4" />
                <span class="text-sm font-medium">Out of stock ({outOfStock.length})</span>
              </div>
              <div class="border-border divide-border divide-y rounded-xl border">
                {#each outOfStock.slice(0, 5) as product (product.id)}
                  <a
                    href={`/${params.slug}/admin/products/${product.id}`}
                    class="hover:bg-muted/50 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">{product.name}</p>
                      <p class="text-muted-foreground text-xs">{product.sku}</p>
                    </div>
                    <div class="ml-4 flex items-center gap-3">
                      <span class="text-destructive text-sm font-medium">0 in stock</span>
                      {#if product.priceCents > 0}
                        <span class="text-muted-foreground text-xs">
                          <Pricing cents={product.priceCents} country={shop.country} />
                        </span>
                      {/if}
                    </div>
                  </a>
                {/each}
                {#if outOfStock.length > 5}
                  <a
                    href={`/${params.slug}/admin/products`}
                    class="text-muted-foreground hover:text-foreground px-4 py-2.5 text-center text-xs transition-colors"
                  >
                    View all {outOfStock.length} out of stock items
                  </a>
                {/if}
              </div>
            </div>
          {/if}

          {#if lowStock.length > 0}
            <div>
              <div class="mb-2 flex items-center gap-2">
                <TriangleAlertIcon class="size-4 text-amber-600" />
                <span class="text-sm font-medium">Low stock ({lowStock.length})</span>
              </div>
              <div class="border-border divide-border divide-y rounded-xl border">
                {#each lowStock.slice(0, 5) as product (product.id)}
                  <a
                    href={`/${params.slug}/admin/products/${product.id}`}
                    class="hover:bg-muted/50 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">{product.name}</p>
                      <p class="text-muted-foreground text-xs">{product.sku}</p>
                    </div>
                    <div class="ml-4 flex items-center gap-3">
                      <span class="text-sm font-medium text-amber-600">
                        {product.stock} in stock
                      </span>
                      {#if product.priceCents > 0}
                        <span class="text-muted-foreground text-xs">
                          <Pricing cents={product.priceCents} country={shop.country} />
                        </span>
                      {/if}
                    </div>
                  </a>
                {/each}
                {#if lowStock.length > 5}
                  <a
                    href={`/${params.slug}/admin/products`}
                    class="text-muted-foreground hover:text-foreground px-4 py-2.5 text-center text-xs transition-colors"
                  >
                    View all {lowStock.length} low stock items
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div>
        <h2 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Needs attention
        </h2>
        <div class="border-border bg-card rounded-xl border p-8 text-center">
          <p class="text-sm font-medium">Everything looks good</p>
          <p class="text-muted-foreground mt-1 text-xs">No stock alerts right now</p>
        </div>
      </div>
    {/if}
  </div>
</div>
