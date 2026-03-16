<script lang="ts">
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { toast } from "svelte-sonner";

  import Pricing from "$lib/components/Pricing.svelte";
  import ProductResults from "$lib/components/ProductResults.svelte";
  import BarcodeScanner from "$lib/components/scanner/BarcodeScanner.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const queryClient = useQueryClient();

  const checkoutMutation = createMutation(() =>
    orpc.products.checkout.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Order ${result.orderNumber}: ${result.itemCount} items for ${formatPrice(result.totalCents, shop.country)}`
        );
        cart = [];
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Checkout failed");
      },
    })
  );

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
  const debouncedSearch = new Debounced(() => searchQuery, 300);

  // svelte-ignore non_reactive_update
  let scannerRef: BarcodeScanner | null = null;

  const productSearch = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug: params.slug, search: debouncedSearch.current, pageSize: 10 },
      enabled: !!params.slug && debouncedSearch.current.length > 0 && mode === "search",
    })
  );

  let lastScannedBarcode = $state<string | null>(null);

  const productByBarcode = createQuery(() =>
    orpc.products.get.queryOptions({
      input: { slug: params.slug, barcode: lastScannedBarcode ?? "" },
      enabled: !!params.slug && !!lastScannedBarcode,
    })
  );

  const totalCents = $derived(cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0));
  const totalItems = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));

  function addToCart(id: string, barcode: string | null = null) {
    const existingItem = cart.find((item) => item.id === id);
    if (existingItem) {
      cart = cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
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
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      cart = cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
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
    }
    searchQuery = "";
  }

  $effect(() => {
    if (productByBarcode.data) {
      const product = productByBarcode.data;
      const existingItem = cart.find((item) => item.id === product.id);
      if (existingItem) {
        cart = cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
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
      }
      lastScannedBarcode = null;
    }
  });

  $effect(() => {
    if (productByBarcode.isError) {
      toast.error(`Product not found: ${lastScannedBarcode}`);
      lastScannedBarcode = null;
    }
  });

  function increaseQuantity(id: string) {
    cart = cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  }

  function decreaseQuantity(id: string) {
    const item = cart.find((i) => i.id === id);
    if (item && item.quantity <= 1) {
      removeFromCart(id);
    } else {
      cart = cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
    }
  }

  function removeFromCart(id: string) {
    cart = cart.filter((i) => i.id !== id);
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    checkoutMutation.mutate({
      slug: params.slug,
      items: cart.map((item) => ({
        productId: item.id,
        qty: item.quantity,
        unitPriceCents: item.priceCents,
      })),
    });
  }

  $effect(() => {
    if (mode === "search" && scannerRef) {
      scannerRef.stop();
    }
  });
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href={`/${params.slug}/admin`}>Dashboard</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>Scanner</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </div>
    <p class="text-sm font-medium text-muted-foreground">Scan barcodes or search products to process sales</p>
  </div>
</div>

<div
  class="bg-background flex h-[calc(100dvh-var(--header-height)-var(--spacing)*2)] flex-col overflow-hidden rounded-lg border"
>
  <section class="shrink-0">
    <div class="flex border-b">
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors {mode ===
        'scan'
          ? 'border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground border-transparent'}"
        onclick={() => (mode = "scan")}
      >
        <ScanLineIcon class="size-4" />
        Scan
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors {mode ===
        'search'
          ? 'border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground border-transparent'}"
        onclick={() => (mode = "search")}
      >
        <SearchIcon class="size-4" />
        Search
      </button>
    </div>

    {#if mode === "scan"}
      <div class="shrink-0 overflow-hidden border-b-4" style="height: 220px;">
        <BarcodeScanner
          bind:this={scannerRef}
          containerId="pos-barcode-scanner"
          onScan={addToCart}
          class="relative h-full w-full"
        />
      </div>
    {:else}
      <div class="relative flex flex-col gap-3 p-4">
        <div class="relative">
          <SearchIcon
            class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search products..."
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-9 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {#if searchQuery.length > 0}
          <ProductResults
            products={productSearch.data?.items ?? []}
            isLoading={productSearch.isLoading}
            country={shop.country}
            searchQuery={debouncedSearch.current}
            onSelect={handleProductSelect}
          />
        {/if}
      </div>
    {/if}
  </section>

  <section class="min-h-0 flex-1">
    <ScrollArea.Root class="h-full w-full">
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
          {#each cart as item (item.id)}
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
                    <Pricing
                      cents={item.priceCents * item.quantity}
                      country={shop.country}
                      priceClass="text-xs tabular-nums text-muted-foreground"
                      prefixClass="text-sm text-muted-foreground"
                      suffixClass="text-sm text-muted-foreground"
                    />
                  </div>

                  <!-- Quantity Controls -->
                  <div
                    class="border-border/50 bg-muted/30 flex items-center gap-1 rounded-lg border p-0.5"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      class="hover:bg-background size-7 shrink-0"
                      onclick={() => decreaseQuantity(item.id)}
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon class="size-3.5" />
                    </Button>
                    <span class="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="hover:bg-background size-7 shrink-0"
                      onclick={() => increaseQuantity(item.id)}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon class="size-3.5" />
                    </Button>
                  </div>

                  <!-- Price & Delete -->
                  <div class="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8 shrink-0"
                      onclick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
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
            <p class="text-muted-foreground text-xs">Total ({totalItems} items)</p>
            <Pricing cents={totalCents} country={shop.country} priceClass="text-lg font-bold" />
          </div>
        </div>
      </div>

      <Button
        class="gap-2 px-6"
        onclick={handleCheckout}
        disabled={cart.length === 0 || checkoutMutation.isPending}
      >
        {checkoutMutation.isPending ? "Processing..." : "Checkout"}
      </Button>
    </div>
  </section>
</div>
