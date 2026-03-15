<script lang="ts">
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
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

  const { params }: PageProps = $props();

  const queryClient = useQueryClient();

  const checkoutMutation = createMutation(() =>
    orpc.products.checkout.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Order ${result.orderNumber}: ${result.itemCount} items for ${formatPrice(result.totalCents, shop.data?.country)}`
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

  const shop = createQuery(() =>
    orpc.shops.get.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

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

  function addToCart(barcode: string) {
    const existingItem = cart.find((item) => item.barcode === barcode);
    if (existingItem) {
      cart = cart.map((item) =>
        item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
      );
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
    if (product.barcode) {
      addToCart(product.barcode);
    } else {
      cart.push({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        priceCents: product.priceCents,
        quantity: 1,
        image: product.image,
      });
    }
    searchQuery = "";
  }

  $effect(() => {
    if (productByBarcode.data) {
      const product = productByBarcode.data;
      cart.push({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        priceCents: product.priceCents,
        quantity: 1,
        image: product.image,
      });
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
    cart = cart.filter((i) => i.barcode !== barcode);
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

<div class="bg-background flex h-[calc(100dvh-72px)] flex-col overflow-hidden">
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
            country={shop.data?.country ?? undefined}
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
                    <p class="text-muted-foreground hidden text-xs sm:block">{item.barcode}</p>
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
                    <span class="w-6 text-center text-sm font-medium sm:w-8 sm:text-sm"
                      >{item.quantity}</span
                    >
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

                  <p class="w-12 text-right sm:w-16">
                    <Pricing
                      cents={item.priceCents * item.quantity}
                      country={shop.data?.country ?? null}
                      priceClass="text-sm font-semibold"
                    />
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
            <Pricing
              cents={totalCents}
              country={shop.data?.country ?? null}
              priceClass="text-lg font-bold"
            />
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
