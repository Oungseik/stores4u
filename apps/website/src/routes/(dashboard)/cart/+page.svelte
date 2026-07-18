<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as InputGroup from "@repo/ui/input-group";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import * as Tabs from "@repo/ui/tabs";
  import { createQuery } from "@tanstack/svelte-query";
  import { goto } from "$app/navigation";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import ProductResults from "$lib/components/ProductResults.svelte";
  import BarcodeScanner from "$lib/components/scanner/BarcodeScanner.svelte";
  import { cart } from "$lib/cart.svelte";
  import { orpc } from "$lib/orpc_client";
  import { checkoutModeSchema } from "$lib/search_param";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const searchParams = useSearchParams(checkoutModeSchema, { noScroll: true });
  let searchQuery = $state("");
  const debouncedSearch = new Debounced(() => searchQuery, 300);

  let lastScannedBarcode = $state<string | null>(null);

  const isDebouncing = $derived(searchQuery !== debouncedSearch.current);

  const productSearch = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { search: debouncedSearch.current, pageSize: 10 },
      enabled: true && debouncedSearch.current.length > 0 && searchParams.mode === "search",
    }),
  );

  const isSearching = $derived(isDebouncing || productSearch.isFetching);

  const productByBarcode = createQuery(() =>
    orpc.products.get.queryOptions({
      input: { barcode: lastScannedBarcode ?? "" },
      enabled: true && !!lastScannedBarcode,
    }),
  );

  function addToCart(id: string, barcode: string | null = null) {
    const existingItem = cart.items.find((item) => item.id === id);
    if (existingItem) {
      cart.bump(id, 1);
    } else {
      lastScannedBarcode = barcode;
    }
  }

  function handleProductSelect(product: {
    id: string;
    barcode: string | null;
    name: string;
    priceCents: number;
    image: string | null;
  }) {
    cart.add(product);
    searchQuery = "";
  }

  $effect(() => {
    if (productByBarcode.data) {
      const product = productByBarcode.data;
      cart.add({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        priceCents: product.priceCents,
        image: product.image,
      });
      lastScannedBarcode = null;
    }
  });

  $effect(() => {
    if (productByBarcode.isError) {
      toast.error(msg.error_product_not_found_value({ product: lastScannedBarcode ?? "" }));
      lastScannedBarcode = null;
    }
  });

  function handleCheckout() {
    if (cart.items.length === 0) {
      toast.error(msg.ui_cart_is_empty());
      return;
    }
    goto("/checkout");
  }
</script>

<div
  class="bg-background m-[calc(var(--spacing)*2)] flex h-[calc(100dvh-var(--spacing)*4)] flex-col overflow-hidden rounded-lg border lg:m-0"
>
  <Tabs.Root bind:value={searchParams.mode} class="flex shrink-0 flex-col">
    <div class="flex items-center border-b">
      <div class="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
      </div>
      <Tabs.List class="flex-1">
        <Tabs.Trigger value="scan" class="gap-2">
          <ScanLineIcon />
          {msg.ui_scan()}
        </Tabs.Trigger>
        <Tabs.Trigger value="search" class="gap-2">
          <SearchIcon />
          {msg.ui_search()}
        </Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value="scan" class="shrink-0 border-b-4 p-4">
      <div class="h-48">
        <BarcodeScanner
          containerId="stores4u-barcode-scanner"
          onScan={addToCart}
          enabled={searchParams.mode === "scan"}
          class="bg-muted relative h-40 w-full overflow-hidden rounded-lg"
        />
      </div>
    </Tabs.Content>

    <Tabs.Content value="search" class="relative flex flex-col gap-3 p-4">
      <InputGroup.Root>
        <InputGroup.Addon>
          <SearchIcon />
        </InputGroup.Addon>
        <InputGroup.Input bind:value={searchQuery} placeholder={msg.ui_search_products()} />
      </InputGroup.Root>
      {#if searchQuery.length > 0}
        <ProductResults
          products={productSearch.data?.items ?? []}
          isLoading={isSearching}
          currency={shop.currency}
          {searchQuery}
          onSelect={handleProductSelect}
        />
      {/if}
    </Tabs.Content>
  </Tabs.Root>

  <section class="min-h-0 flex-1">
    <ScrollArea.Root class="h-full w-full">
      {#if cart.items.length === 0}
        <div class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="bg-muted flex size-16 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-muted-foreground size-8" />
          </div>
          <h3 class="text-lg font-semibold">{msg.ui_cart_is_empty()}</h3>
          <p class="text-muted-foreground max-w-sm text-sm">
            {msg.ui_scan_or_search_to_add_products()}
          </p>
        </div>
      {:else}
        <div class="space-y-1.5 p-4">
          {#each cart.items as item (item.id)}
            <Card.Root
              class="group border-border/60 hover:border-border overflow-hidden p-0 transition-all hover:shadow-sm"
            >
              <Card.Content class="p-0">
                <div class="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5">
                  <!-- Product Image -->
                  <div
                    class="bg-muted/80 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:size-14"
                  >
                    {#if item.image}
                      <img src={item.image} alt={item.name} class="size-full object-cover" />
                    {:else}
                      <PackageIcon class="text-muted-foreground size-5 sm:size-6" />
                    {/if}
                  </div>

                  <!-- Product Info -->
                  <div class="min-w-0 flex-1">
                    <p class="text-foreground truncate text-sm leading-tight font-medium">
                      {item.name}
                    </p>
                    <span class="text-muted-foreground text-xs tabular-nums">
                      {formatPrice(item.priceCents * item.quantity, shop.currency)}
                    </span>
                  </div>

                  <!-- Quantity Controls -->
                  <div
                    class="border-border/50 bg-muted/30 flex items-center gap-1 rounded-lg border p-0.5"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      class="hover:bg-background size-7 shrink-0"
                      onclick={() => cart.bump(item.id, -1)}
                      aria-label={msg.ui_decrease_quantity()}
                    >
                      <MinusIcon />
                    </Button>
                    <span class="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="hover:bg-background size-7 shrink-0"
                      onclick={() => cart.bump(item.id, 1)}
                      aria-label={msg.ui_increase_quantity()}
                    >
                      <PlusIcon />
                    </Button>
                  </div>

                  <!-- Price & Delete -->
                  <div class="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8 shrink-0"
                      onclick={() => cart.remove(item.id)}
                      aria-label={msg.ui_remove_item()}
                    >
                      <Trash2Icon class="size-4" />
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </ScrollArea.Root>
  </section>

  <section class="bg-card h-20 shrink-0 border-t shadow-lg">
    <div class="flex h-full items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-primary size-5" />
          </div>
          <div>
            <p class="text-muted-foreground text-xs">Total ({cart.totalItems} items)</p>
            <span class="text-lg font-bold">{formatPrice(cart.totalCents, shop.currency)}</span>
          </div>
        </div>
      </div>

      <Button class="px-6" onclick={handleCheckout} disabled={cart.items.length === 0}>
        {msg.ui_checkout()}
      </Button>
    </div>
  </section>
</div>
