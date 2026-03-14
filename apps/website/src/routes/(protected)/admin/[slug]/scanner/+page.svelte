<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { toast } from "svelte-sonner";
  import BarcodeScanner from "$lib/components/scanner/BarcodeScanner.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  interface CartItem {
    id: string;
    barcode: string | null;
    name: string;
    priceCents: number;
    quantity: number;
    image: string | null;
  }

  let cart = $state<CartItem[]>([]);
  let mode = $state<"scan" | "search">("scan");
  let searchQuery = $state("");
  const debouncedSearch = new Debounced(() => searchQuery, 500);

  let scannerRef: BarcodeScanner | null = null;

  const shop = createQuery(() =>
    orpc.shops.get.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  let lastScannedBarcode = $state<string | null>(null);

  const productByBarcode = createQuery(() =>
    orpc.products.get.queryOptions({
      input: { slug: params.slug, barcode: lastScannedBarcode ?? "" },
      enabled: !!params.slug && !!lastScannedBarcode,
    })
  );

  const productSearch = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug: params.slug, search: debouncedSearch.current, pageSize: 10 },
      enabled: !!params.slug && debouncedSearch.current.length > 0,
    })
  );

  const totalCents = $derived(cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0));
  const totalItems = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));

  function addToCart(barcode: string) {
    const existingItem = cart.find((item) => item.barcode === barcode);
    if (existingItem) {
      cart = cart.map((item) =>
        item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
      );
      toast.success(`Added another ${existingItem.name}`);
    } else {
      lastScannedBarcode = barcode;
    }
  }

  function addProductToCartFromSearch(product: {
    id: string;
    barcode: string | null;
    name: string;
    priceCents: number;
    image: string | null;
  }) {
    if (product.barcode) {
      addToCart(product.barcode);
    } else {
      cart = [
        ...cart,
        {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          priceCents: product.priceCents,
          quantity: 1,
          image: product.image,
        },
      ];
      toast.success(`Added ${product.name} to cart`);
    }
    searchQuery = "";
  }

  $effect(() => {
    if (productByBarcode.data) {
      const product = productByBarcode.data;
      cart = [
        ...cart,
        {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          priceCents: product.priceCents,
          quantity: 1,
          image: product.image,
        },
      ];
      toast.success(`Added ${product.name} to cart`);
      lastScannedBarcode = null;
    }
  });

  $effect(() => {
    if (productByBarcode.isError) {
      toast.error(`Product not found: ${lastScannedBarcode}`);
      lastScannedBarcode = null;
    }
  });

  function increaseQuantity(barcode: string | null) {
    if (!barcode) return;
    cart = cart.map((item) =>
      item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
    );
  }

  function decreaseQuantity(barcode: string | null) {
    if (!barcode) return;
    const item = cart.find((i) => i.barcode === barcode);
    if (item && item.quantity <= 1) {
      removeFromCart(barcode);
    } else {
      cart = cart.map((i) => (i.barcode === barcode ? { ...i, quantity: i.quantity - 1 } : i));
    }
  }

  function removeFromCart(barcode: string | null) {
    if (!barcode) return;
    const item = cart.find((i) => i.barcode === barcode);
    cart = cart.filter((i) => i.barcode !== barcode);
    if (item) {
      toast.success(`Removed ${item.name}`);
    }
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success(
      `Checkout: ${totalItems} items for ${formatPrice(totalCents, shop.data?.country)}`
    );
  }

  $effect(() => {
    if (mode === "search" && scannerRef) {
      scannerRef.stop();
    }
  });
</script>

<div class="bg-background flex flex-1 flex-col">
  <div class="flex border-b">
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors {mode
        === 'scan'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'}"
      onclick={() => (mode = "scan")}
    >
      <ScanLineIcon class="size-4" />
      Scan
    </button>
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors {mode
        === 'search'
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'}"
      onclick={() => (mode = "search")}
    >
      <SearchIcon class="size-4" />
      Search
    </button>
  </div>

  <div class="shrink-0 overflow-hidden border-b-4" style="height: 220px;">
    {#if mode === "scan"}
      <BarcodeScanner
        bind:this={scannerRef}
        containerId="pos-barcode-scanner"
        onScan={addToCart}
        class="relative h-full w-full"
      />
    {:else}
      <div class="flex h-full flex-col gap-3 p-4">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            bind:value={searchQuery}
            placeholder="Search products by name, SKU, or barcode..."
            class="pl-9"
          />
        </div>

        <div class="flex-1 overflow-y-auto">
          {#if searchQuery.length === 0}
            <div class="flex h-full items-center justify-center text-center">
              <p class="text-muted-foreground text-sm">Type to search products...</p>
            </div>
          {:else if productSearch.isLoading}
            <div class="flex h-full items-center justify-center">
              <Loader2Icon class="size-5 animate-spin text-muted-foreground" />
            </div>
          {:else if productSearch.data?.items.length === 0}
            <div class="flex h-full items-center justify-center text-center">
              <p class="text-muted-foreground text-sm">No products found for "{searchQuery}"</p>
            </div>
          {:else if productSearch.data?.items}
            <div class="space-y-1">
              {#each productSearch.data.items as product (product.id)}
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
                  onclick={() => addProductToCartFromSearch(product)}
                >
                  <div
                    class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md"
                  >
                    {#if product.image}
                      <img
                        src={product.image}
                        alt={product.name}
                        class="size-full rounded-md object-cover"
                      />
                    {:else}
                      <PackageIcon class="text-muted-foreground size-4" />
                    {/if}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{product.name}</p>
                    <p class="text-muted-foreground text-xs">{product.barcode || product.sku || "No barcode"}</p>
                  </div>
                  <p class="text-sm font-semibold">
                    {formatPrice(product.priceCents, shop.data?.country)}
                  </p>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex-1 overflow-hidden">
    <ScrollArea.Root class="h-full">
      {#if cart.length === 0}
        <div class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="bg-muted flex size-16 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-muted-foreground size-8" />
          </div>
          <p class="font-medium">Cart is empty</p>
          <p class="text-muted-foreground text-sm">Scan or search to add products</p>
        </div>
      {:else}
        <div class="space-y-1.5 p-4">
          {#each cart as item (item.barcode)}
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                <div class="flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2.5">
                  <div
                    class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md sm:size-12"
                  >
                    {#if item.image}
                      <img
                        src={item.image}
                        alt={item.name}
                        class="size-full rounded-md object-cover"
                      />
                    {:else}
                      <PackageIcon class="text-muted-foreground size-4 sm:size-5" />
                    {/if}
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{item.name}</p>
                    <p class="text-muted-foreground text-xs hidden sm:block">{item.barcode}</p>
                  </div>

                  <div class="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      class="size-7 shrink-0 sm:size-7"
                      onclick={() => decreaseQuantity(item.barcode)}
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon class="size-3" />
                    </Button>
                    <span class="w-6 text-center text-sm font-medium sm:w-8 sm:text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      class="size-7 shrink-0 sm:size-7"
                      onclick={() => increaseQuantity(item.barcode)}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon class="size-3" />
                    </Button>
                  </div>

                  <p class="w-12 text-right text-sm font-semibold sm:w-16 sm:text-sm">
                    {formatPrice(item.priceCents * item.quantity, shop.data?.country)}
                  </p>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-destructive size-7 shrink-0 sm:size-8"
                    onclick={() => removeFromCart(item.barcode)}
                    aria-label="Remove item"
                  >
                    <Trash2Icon class="size-3.5 sm:size-4" />
                  </Button>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </ScrollArea.Root>
  </div>

  <div class="bg-card sticky right-0 bottom-0 left-0 h-20 border-t shadow-lg">
    <div class="flex h-full items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-primary size-5" />
          </div>
          <div>
            <p class="text-muted-foreground text-xs">Total ({totalItems} items)</p>
            <p class="text-lg font-bold">{formatPrice(totalCents, shop.data?.country)}</p>
          </div>
        </div>
      </div>

      <Button class="gap-2 px-6" onclick={handleCheckout} disabled={cart.length === 0}>
        Checkout
      </Button>
    </div>
  </div>
</div>
