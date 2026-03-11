<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import HeartIcon from "@lucide/svelte/icons/heart";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import MenuIcon from "@lucide/svelte/icons/menu";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { page } from "$app/state";
  import { orpc } from "$lib/orpc_client";

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_LOGO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23e2e8f0' cx='100' cy='100' r='100'/%3E%3Ctext fill='%2394a3b8' font-family='system-ui' font-size='32' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E%E2%97%8B%3C/text%3E%3C/svg%3E";

  const PLACEHOLDER_HERO =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='600'/%3E%3C/svg%3E";

  const shopQuery = createQuery(() =>
    orpc.shops.getShop.queryOptions({
      input: { slug: page.params.slug ?? "" },
      enabled: !!page.params.slug,
    })
  );

  const categoriesQuery = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { slug: page.params.slug ?? "", pageSize: 100 },
      enabled: !!page.params.slug,
    })
  );

  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug: page.params.slug ?? "", pageSize: 100 },
      enabled: !!page.params.slug,
    })
  );

  const shop = $derived(shopQuery.data);
  const categories = $derived(categoriesQuery.data?.items ?? []);
  const products = $derived(productsQuery.data?.items ?? []);

  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state("");
  let isSearchOpen = $state(false);
  let isCartOpen = $state(false);
  let isProductModalOpen = $state(false);
  let selectedProduct = $state<(typeof products)[0] | null>(null);
  let displayedProductCount = $state(8);
  let isLoadingMore = $state(false);

  let cartItems = $state<Array<{ product: (typeof products)[0]; quantity: number }>>([]);

  let wishlistIds = $state<Set<string>>(new Set());

  let filteredProducts = $derived(
    products.filter((product) => {
      const matchesCategory = !selectedCategory || product.categoryIds.includes(selectedCategory);
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesCategory && matchesSearch;
    })
  );

  let displayedProducts = $derived(filteredProducts.slice(0, displayedProductCount));

  let hasMoreProducts = $derived(displayedProductCount < filteredProducts.length);

  let cartItemCount = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));

  function formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)}`;
  }

  function getImageUrl(image: string | null | undefined): string {
    return image || PLACEHOLDER_IMAGE;
  }

  function getLogoUrl(logo: string | null | undefined): string {
    return logo || PLACEHOLDER_LOGO;
  }

  function getHeroUrl(heroImage: string | null | undefined): string {
    return heroImage || PLACEHOLDER_HERO;
  }

  async function loadMoreProducts() {
    if (isLoadingMore || !hasMoreProducts) return;
    isLoadingMore = true;
    await new Promise((resolve) => setTimeout(resolve, 300));
    displayedProductCount = Math.min(displayedProductCount + 4, filteredProducts.length);
    isLoadingMore = false;
  }

  function addToCart(product: (typeof products)[0]) {
    const existingItem = cartItems.find((item) => item.product.id === product.id);
    if (existingItem) {
      cartItems = cartItems.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      cartItems = [...cartItems, { product, quantity: 1 }];
    }
    toast.success(`${product.name} added to cart`);
  }

  function updateCartQuantity(productId: string, delta: number) {
    cartItems = cartItems
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
  }

  function toggleWishlist(productId: string) {
    const newWishlist = new Set(wishlistIds);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
      toast.success("Removed from wishlist");
    } else {
      newWishlist.add(productId);
      toast.success("Added to wishlist");
    }
    wishlistIds = newWishlist;
  }

  function openProductModal(product: (typeof products)[0]) {
    selectedProduct = product;
    isProductModalOpen = true;
  }

  function resetProductDisplay() {
    displayedProductCount = 8;
  }

  $effect(() => {
    if (selectedCategory || searchQuery) {
      resetProductDisplay();
    }
  });
</script>

<div class="bg-background min-h-svh">
  {#if shopQuery.isLoading}
    <div class="flex h-svh items-center justify-center">
      <Loader2Icon class="size-8 animate-spin" />
    </div>
  {:else if shopQuery.error}
    <div class="flex h-svh items-center justify-center">
      <p class="text-lg text-red-500">Failed to load shop</p>
    </div>
  {:else if shop}
    <!-- Header -->
    <header
      class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur"
    >
      <div class="flex h-14 items-center justify-between px-4">
        <button type="button" class="-ml-2 p-2 lg:hidden">
          <MenuIcon class="size-5" />
        </button>

        <div class="flex items-center gap-2">
          <img
            src={getLogoUrl(shop.logo)}
            alt={shop.name}
            class="h-8 w-8 rounded-full object-cover"
          />
          <span class="hidden text-lg font-semibold sm:block">{shop.name}</span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="hover:bg-muted rounded-full p-2"
            onclick={() => (isSearchOpen = !isSearchOpen)}
          >
            <SearchIcon class="size-5" />
          </button>

          <button
            type="button"
            class="hover:bg-muted relative rounded-full p-2"
            onclick={() => (isCartOpen = true)}
          >
            <ShoppingCartIcon class="size-5" />
            {#if cartItemCount > 0}
              <Badge
                class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {cartItemCount}
              </Badge>
            {/if}
          </button>
        </div>
      </div>

      {#if isSearchOpen}
        <div class="border-t px-4 py-3">
          <div class="relative">
            <SearchIcon
              class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              placeholder="Search products..."
              class="pl-9"
              bind:value={searchQuery}
            />
          </div>
        </div>
      {/if}
    </header>

    <!-- Hero Section -->
    <section class="relative h-56 w-full overflow-hidden sm:h-72 md:h-80">
      <img src={getHeroUrl(shop.heroImage)} alt={shop.name} class="h-full w-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"></div>

      <div
        class="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white"
      >
        <div
          class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm sm:mb-4 sm:h-20 sm:w-20"
        >
          <img
            src={getLogoUrl(shop.logo)}
            alt={shop.name}
            class="h-full w-full rounded-full object-cover"
          />
        </div>

        <h1 class="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">{shop.name}</h1>

        {#if shop.description}
          <p class="mb-4 max-w-md text-sm text-white/80 sm:text-base md:mb-6">
            {shop.description}
          </p>
        {/if}

        <div
          class="flex flex-wrap items-center justify-center gap-3 text-xs text-white/70 sm:text-sm"
        >
          {#if shop.address}
            <span class="flex items-center gap-1">
              <MapPinIcon class="size-3.5 sm:size-4" />
              {shop.address}
            </span>
          {/if}
          {#if shop.phone}
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1">
              <PhoneIcon class="size-3.5 sm:size-4" />
              {shop.phone}
            </span>
          {/if}
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
          <Badge class="bg-white/20 text-white backdrop-blur-sm">
            {shop.productCount}+ Products
          </Badge>
        </div>
      </div>
    </section>

    <!-- Category Filters - Tab Style -->
    <div
      class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-14 z-30 border-b backdrop-blur"
    >
      <ScrollArea.Root class="w-full">
        <div class="flex gap-1 px-2 py-2 sm:gap-2 sm:px-4">
          <button
            type="button"
            class={buttonVariants({
              variant: selectedCategory === null ? "default" : "ghost",
              class: "relative h-9 px-3 text-sm sm:h-10 sm:px-4",
            })}
            onclick={() => (selectedCategory = null)}
          >
            <span>All</span>
            <span class="ml-1.5 text-xs opacity-60">({products.length})</span>

            {#if selectedCategory === null}
              <div class="bg-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full"></div>
            {/if}
          </button>
          {#each categories as category (category.id)}
            <button
              type="button"
              class={buttonVariants({
                variant: selectedCategory === category.id ? "default" : "ghost",
                class: "relative h-9 px-3 text-sm sm:h-10 sm:px-4",
              })}
              onclick={() => (selectedCategory = category.id)}
            >
              <span>{category.name}</span>
              <span class="ml-1.5 text-xs opacity-60">({category.productCount})</span>

              {#if selectedCategory === category.id}
                <div class="bg-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full"></div>
              {/if}
            </button>
          {/each}
        </div>
      </ScrollArea.Root>
    </div>

    <!-- Products Section -->
    <main class="p-4 sm:p-6">
      <!-- Section Header -->
      <div class="mb-4 flex items-center justify-between sm:mb-6">
        <div>
          <h2 class="text-lg font-semibold sm:text-xl">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name || "All Products"
              : "All Products"}
          </h2>
          <p class="text-muted-foreground text-sm">
            {filteredProducts.length} products available
          </p>
        </div>
      </div>

      {#if filteredProducts.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <SearchIcon class="text-muted-foreground size-8" />
          </div>
          <p class="text-lg font-medium">No products found</p>
          <p class="text-muted-foreground mt-1 text-sm">Try adjusting your search or filter</p>
        </div>
      {:else}
        <!-- Product Grid - Increased spacing -->
        <div
          class="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5"
        >
          {#each displayedProducts as product (product.id)}
            <Card.Root
              class="group border-border/50 relative flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-lg"
            >
              <!-- Image Container -->
              <div
                class="bg-muted relative aspect-[4/3] w-full cursor-pointer overflow-hidden"
                onclick={() => openProductModal(product)}
                onkeydown={(e) => e.key === "Enter" && openProductModal(product)}
                role="button"
                tabindex="0"
              >
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <!-- Overlay on hover -->
                <div
                  class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
                ></div>

                <!-- Wishlist Button -->
                <button
                  type="button"
                  class="bg-background/90 hover:bg-background absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:scale-110"
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                >
                  <HeartIcon
                    class="size-4 transition-colors {wishlistIds.has(product.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground'}"
                  />
                </button>

                <!-- Out of Stock Overlay -->
                {#if !product.inStock}
                  <div class="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span
                      class="bg-background text-foreground rounded-full px-3 py-1 text-sm font-medium"
                    >
                      Out of Stock
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Card Content -->
              <Card.Content class="flex flex-1 flex-col p-3 sm:p-4">
                <button
                  type="button"
                  class="cursor-pointer text-left"
                  onclick={() => openProductModal(product)}
                >
                  <h3 class="line-clamp-2 text-sm leading-tight font-semibold sm:text-base">
                    {product.name}
                  </h3>
                </button>

                {#if product.uom}
                  <p class="text-muted-foreground mt-1 text-xs">{product.uom}</p>
                {/if}

                <div class="mt-auto flex flex-col gap-2 pt-2">
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-bold sm:text-xl">
                      {formatPrice(product.priceCents)}
                    </span>
                  </div>

                  <!-- Stock indicator -->
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full {product.inStock
                        ? 'bg-green-500'
                        : 'bg-red-500'}"
                    ></span>
                    <span class="text-xs {product.inStock ? 'text-green-600' : 'text-red-500'}">
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <!-- Add to Cart Button -->
                  {#if product.inStock}
                    {#if cartItems.find((item) => item.product.id === product.id)}
                      <div class="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          class="h-8 w-8 flex-shrink-0"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            updateCartQuantity(product.id, -1);
                          }}
                        >
                          <MinusIcon class="size-3.5" />
                        </Button>
                        <div class="flex-1 text-center text-sm font-medium">
                          {cartItems.find((item) => item.product.id === product.id)?.quantity || 0}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          class="h-8 w-8 flex-shrink-0"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            updateCartQuantity(product.id, 1);
                          }}
                        >
                          <PlusIcon class="size-3.5" />
                        </Button>
                      </div>
                    {:else}
                      <Button
                        size="sm"
                        class="w-full gap-1.5"
                        onclick={(e: MouseEvent) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <ShoppingCartIcon class="size-3.5" />
                        Add to Cart
                      </Button>
                    {/if}
                  {:else}
                    <Button size="sm" class="w-full" disabled variant="secondary">
                      Out of Stock
                    </Button>
                  {/if}
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>

        <!-- Load More Button -->
        {#if hasMoreProducts}
          <div class="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              class="gap-2"
              onclick={loadMoreProducts}
              disabled={isLoadingMore}
            >
              {#if isLoadingMore}
                <Loader2Icon class="size-4 animate-spin" />
                Loading...
              {:else}
                Load More Products
                <ChevronRightIcon class="size-4" />
              {/if}
            </Button>
          </div>
        {/if}
      {/if}
    </main>
  {/if}
</div>
