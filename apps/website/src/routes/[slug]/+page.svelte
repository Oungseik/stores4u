<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import HeartIcon from "@lucide/svelte/icons/heart";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MenuIcon from "@lucide/svelte/icons/menu";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import * as Separator from "@repo/ui/separator";
  import * as Sheet from "@repo/ui/sheet";
  import * as Skeleton from "@repo/ui/skeleton";
  import { toast } from "svelte-sonner";

  // ============================================
  // MOCK DATA - TODO: Replace with API calls
  // ============================================

  // GET /api/shops/:slug - Shop info
  // TODO: Get slug from route params - page.params.slug (need +page.ts load function for proper typing)
  const mockShop = {
    id: "shop-1",
    name: "Fresh Mart",
    slug: "fresh-mart",
    logo: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop",
    description: "Your local fresh produce market",
    address: "123 Market Street",
    phone: "+1 234 567 8900",
  };

  // GET /api/shops/:slug/categories
  const mockCategories = [
    { id: "cat-1", name: "All", slug: "all", productCount: 24 },
    { id: "cat-2", name: "Fruits", slug: "fruits", productCount: 12 },
    { id: "cat-3", name: "Vegetables", slug: "vegetables", productCount: 8 },
    { id: "cat-4", name: "Dairy", slug: "dairy", productCount: 6 },
    { id: "cat-5", name: "Bakery", slug: "bakery", productCount: 4 },
    { id: "cat-6", name: "Beverages", slug: "beverages", productCount: 5 },
  ];

  // GET /api/shops/:slug/products
  const mockProducts = [
    {
      id: "prod-1",
      name: "Organic Apples",
      sku: "APL-001",
      description: "Fresh organic apples from local farms. Crisp, sweet, and juicy.",
      price: 4.99,
      originalPrice: 5.99,
      uom: "lb",
      images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop"],
      categoryIds: ["cat-2"],
      inStock: true,
      stockQty: 50,
    },
    {
      id: "prod-2",
      name: "Fresh Bananas",
      sku: "BAN-001",
      description: "Ripe and ready to eat bananas. Rich in potassium.",
      price: 1.99,
      uom: "bunch",
      images: ["https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop"],
      categoryIds: ["cat-2"],
      inStock: true,
      stockQty: 100,
    },
    {
      id: "prod-3",
      name: "Organic Spinach",
      sku: "SPN-001",
      description: "Fresh organic spinach leaves. Perfect for salads.",
      price: 3.49,
      uom: "bunch",
      images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop"],
      categoryIds: ["cat-3"],
      inStock: true,
      stockQty: 30,
    },
    {
      id: "prod-4",
      name: "Whole Milk",
      sku: "MLK-001",
      description: "Fresh whole milk from grass-fed cows. 1 gallon.",
      price: 5.99,
      uom: "gallon",
      images: ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop"],
      categoryIds: ["cat-4"],
      inStock: true,
      stockQty: 25,
    },
    {
      id: "prod-5",
      name: "Sourdough Bread",
      sku: "BRD-001",
      description: "Artisan sourdough bread baked fresh daily.",
      price: 6.99,
      uom: "loaf",
      images: ["https://images.unsplash.com/photo-1585478259715-876ace1d4b04?w=400&h=400&fit=crop"],
      categoryIds: ["cat-5"],
      inStock: true,
      stockQty: 15,
    },
    {
      id: "prod-6",
      name: "Fresh Orange Juice",
      sku: "OJU-001",
      description: "Freshly squeezed orange juice. No added sugar.",
      price: 4.49,
      uom: "bottle",
      images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop"],
      categoryIds: ["cat-6"],
      inStock: true,
      stockQty: 40,
    },
    {
      id: "prod-7",
      name: "Red Grapes",
      sku: "GRP-001",
      description: "Sweet and seedless red grapes. Perfect for snacking.",
      price: 3.99,
      uom: "lb",
      images: ["https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop"],
      categoryIds: ["cat-2"],
      inStock: true,
      stockQty: 35,
    },
    {
      id: "prod-8",
      name: "Fresh Carrots",
      sku: "CRT-001",
      description: "Organic carrots, freshly harvested. Great for snacking.",
      price: 2.49,
      uom: "bunch",
      images: ["https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop"],
      categoryIds: ["cat-3"],
      inStock: true,
      stockQty: 60,
    },
  ];

  // ============================================
  // STATE
  // ============================================

  let selectedCategory = $state("cat-1");
  let searchQuery = $state("");
  let isSearchOpen = $state(false);
  let isCartOpen = $state(false);
  let isProductModalOpen = $state(false);
  let selectedProduct = $state<(typeof mockProducts)[0] | null>(null);

  // Cart state - TODO: POST /api/cart, GET /api/cart
  let cartItems = $state<Array<{ product: (typeof mockProducts)[0]; quantity: number }>>([]);

  // Wishlist state - TODO: GET /api/wishlist, POST /api/wishlist
  let wishlistIds = $state<Set<string>>(new Set(["prod-3"]));

  // ============================================
  // DERIVED
  // ============================================

  let filteredProducts = $derived(
    mockProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "cat-1" || product.categoryIds.includes(selectedCategory);
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
  );

  let cartTotal = $derived(
    cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  let cartItemCount = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));

  // ============================================
  // ACTIONS
  // ============================================

  function addToCart(product: (typeof mockProducts)[0]) {
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

  function removeFromCart(productId: string) {
    cartItems = cartItems.filter((item) => item.product.id !== productId);
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

  function openProductModal(product: (typeof mockProducts)[0]) {
    selectedProduct = product;
    isProductModalOpen = true;
  }

  function closeProductModal() {
    isProductModalOpen = false;
    selectedProduct = null;
  }
</script>

<div class="bg-background min-h-svh">
  <!-- Header -->
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur"
  >
    <div class="flex h-14 items-center justify-between px-4">
      <!-- Mobile Menu Button -->
      <button type="button" class="-ml-2 p-2 lg:hidden">
        <MenuIcon class="size-5" />
      </button>

      <!-- Shop Logo/Name -->
      <div class="flex items-center gap-2">
        <img src={mockShop.logo} alt={mockShop.name} class="h-8 w-8 rounded-full object-cover" />
        <span class="hidden text-lg font-semibold sm:block">{mockShop.name}</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <!-- Search Toggle -->
        <button
          type="button"
          class="hover:bg-muted rounded-full p-2"
          onclick={() => (isSearchOpen = !isSearchOpen)}
        >
          <SearchIcon class="size-5" />
        </button>

        <!-- Cart Button -->
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

    <!-- Search Bar (Expandable) -->
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

  <!-- Banner -->
  <div class="relative h-32 w-full overflow-hidden sm:h-48">
    <img src={mockShop.banner} alt={mockShop.name} class="h-full w-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    <div class="absolute bottom-4 left-4 text-white">
      <h1 class="text-xl font-bold sm:text-2xl">{mockShop.name}</h1>
      <p class="text-sm opacity-90">{mockShop.description}</p>
    </div>
  </div>

  <!-- Category Filters -->
  <div class="bg-background sticky top-14 z-30 border-b">
    <ScrollArea.Root class="w-full">
      <div class="flex gap-2 px-4 py-3">
        {#each mockCategories as category}
          <button
            type="button"
            class={buttonVariants({
              variant: selectedCategory === category.id ? "default" : "outline",
              size: "sm",
              class: "rounded-full whitespace-nowrap",
            })}
            onclick={() => (selectedCategory = category.id)}
          >
            {category.name}
            <span class="ml-1 text-xs opacity-70">({category.productCount})</span>
          </button>
        {/each}
      </div>
    </ScrollArea.Root>
  </div>

  <!-- Products Grid -->
  <main class="p-4">
    {#if filteredProducts.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <SearchIcon class="text-muted-foreground mb-4 size-12" />
        <p class="text-lg font-medium">No products found</p>
        <p class="text-muted-foreground text-sm">Try adjusting your search or filter</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {#each filteredProducts as product (product.id)}
          <Card.Root
            class="cursor-pointer overflow-hidden transition-all hover:shadow-md"
            onclick={() => openProductModal(product)}
          >
            <div class="bg-muted relative aspect-square overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                class="h-full w-full object-cover transition-transform hover:scale-105"
              />
              <!-- Wishlist Button -->
              <button
                type="button"
                class="bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full p-1.5 shadow-sm"
                onclick={(e: MouseEvent) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
              >
                <HeartIcon
                  class="size-4 {wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}"
                />
              </button>
              {#if product.originalPrice}
                <Badge class="absolute top-2 left-2 bg-red-500">Sale</Badge>
              {/if}
            </div>
            <Card.Content class="p-3">
              <h3 class="line-clamp-2 text-sm font-medium">{product.name}</h3>
              <p class="text-muted-foreground mt-1 text-xs">{product.uom}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-sm font-bold">${product.price.toFixed(2)}</span>
                {#if product.originalPrice}
                  <span class="text-muted-foreground text-xs line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                {/if}
              </div>
              <Button
                size="sm"
                class="mt-3 w-full"
                variant={cartItems.some((item) => item.product.id === product.id)
                  ? "secondary"
                  : "default"}
                onclick={(e: MouseEvent) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
              >
                {cartItems.some((item) => item.product.id === product.id)
                  ? "Add More"
                  : "Add to Cart"}
              </Button>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </main>

  <!-- Product Detail Modal -->
  <Sheet.Root open={isProductModalOpen} onOpenChange={(open) => !open && closeProductModal()}>
    <Sheet.Content
      side="bottom"
      class="h-[85vh] sm:top-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[80vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:rounded-lg"
    >
      <Sheet.Header class="flex-shrink-0">
        <Sheet.Title class="flex items-center gap-2">Product Details</Sheet.Title>
      </Sheet.Header>

      {#if selectedProduct}
        <ScrollArea.Root class="h-full sm:max-h-[60vh]">
          <div class="p-4 sm:p-6">
            <!-- Product Image -->
            <div
              class="bg-muted relative mx-auto mb-4 aspect-square max-w-sm overflow-hidden rounded-lg sm:float-left sm:mb-0 sm:w-1/2 sm:max-w-none sm:pr-6"
            >
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                class="h-full w-full object-cover"
              />
            </div>

            <!-- Product Info -->
            <div class="sm:float-right sm:w-1/2">
              <div class="flex items-start justify-between gap-2">
                <h2 class="text-xl font-bold">{selectedProduct.name}</h2>
                <button
                  type="button"
                  class="hover:bg-muted flex-shrink-0 rounded-full p-1"
                  onclick={() => selectedProduct && toggleWishlist(selectedProduct.id)}
                >
                  <HeartIcon
                    class="size-5 {wishlistIds.has(selectedProduct.id)
                      ? 'fill-red-500 text-red-500'
                      : ''}"
                  />
                </button>
              </div>

              <p class="text-muted-foreground mt-1 text-sm">SKU: {selectedProduct.sku}</p>

              <div class="mt-3 flex items-center gap-2">
                <span class="text-2xl font-bold">${selectedProduct.price.toFixed(2)}</span>
                <span class="text-muted-foreground">/ {selectedProduct.uom}</span>
                {#if selectedProduct.originalPrice}
                  <span class="text-muted-foreground text-sm line-through">
                    ${selectedProduct.originalPrice.toFixed(2)}
                  </span>
                {/if}
              </div>

              <div class="mt-2 flex items-center gap-2">
                {#if selectedProduct?.inStock}
                  <Badge variant="secondary">In Stock ({selectedProduct?.stockQty})</Badge>
                {:else}
                  <Badge variant="destructive">Out of Stock</Badge>
                {/if}
              </div>

              <Separator.Root class="my-4" />

              <p class="text-muted-foreground text-sm leading-relaxed">
                {selectedProduct.description}
              </p>

              <div class="mt-6 flex gap-2">
                {#if selectedProduct?.inStock}
                  {#if cartItems.find((item) => item.product.id === selectedProduct?.id)}
                    <div class="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onclick={() =>
                          selectedProduct && updateCartQuantity(selectedProduct.id, -1)}
                      >
                        <MinusIcon class="size-4" />
                      </Button>
                      <span class="w-8 text-center font-medium">
                        {cartItems.find((item) => item.product.id === selectedProduct?.id)
                          ?.quantity || 0}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onclick={() => selectedProduct && updateCartQuantity(selectedProduct.id, 1)}
                      >
                        <PlusIcon class="size-4" />
                      </Button>
                    </div>
                  {/if}
                  <Button
                    class="flex-1"
                    onclick={() => selectedProduct && addToCart(selectedProduct)}
                  >
                    <ShoppingCartIcon class="mr-2 size-4" />
                    Add to Cart
                  </Button>
                {:else}
                  <Button class="flex-1" disabled>Out of Stock</Button>
                {/if}
              </div>
            </div>
          </div>
        </ScrollArea.Root>
      {/if}
    </Sheet.Content>
  </Sheet.Root>

  <!-- Cart Drawer -->
  <Sheet.Root open={isCartOpen} onOpenChange={(open) => (isCartOpen = open)}>
    <Sheet.Content side="right" class="flex w-full flex-col sm:w-96">
      <Sheet.Header class="flex-shrink-0">
        <Sheet.Title class="flex items-center gap-2">
          <ShoppingCartIcon class="size-5" />
          Your Cart
          {#if cartItemCount > 0}
            <Badge variant="secondary">{cartItemCount}</Badge>
          {/if}
        </Sheet.Title>
        <Sheet.Description>
          {cartItems.length === 0
            ? "Your cart is empty"
            : `${cartItems.length} item(s) in your cart`}
        </Sheet.Description>
      </Sheet.Header>

      {#if cartItems.length === 0}
        <div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <ShoppingCartIcon class="text-muted-foreground size-16" />
          <p class="text-muted-foreground text-center">Start shopping to add items to your cart</p>
          <Button variant="outline" onclick={() => (isCartOpen = false)}>Browse Products</Button>
        </div>
      {:else}
        <ScrollArea.Root class="flex-1">
          <div class="space-y-4 p-4">
            {#each cartItems as item (item.product.id)}
              <div class="flex gap-3">
                <div class="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    class="h-full w-full object-cover"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="truncate text-sm font-medium">{item.product.name}</h4>
                  <p class="text-muted-foreground text-xs">
                    ${item.product.price.toFixed(2)} / {item.product.uom}
                  </p>
                  <div class="mt-2 flex items-center justify-between">
                    <div class="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        class="h-7 w-7"
                        onclick={() => updateCartQuantity(item.product.id, -1)}
                      >
                        <MinusIcon class="size-3" />
                      </Button>
                      <span class="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        class="h-7 w-7"
                        onclick={() => updateCartQuantity(item.product.id, 1)}
                      >
                        <PlusIcon class="size-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onclick={() => removeFromCart(item.product.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </ScrollArea.Root>

        <div class="flex-shrink-0 space-y-4 border-t p-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">Subtotal</span>
            <span class="text-xl font-bold">${cartTotal.toFixed(2)}</span>
          </div>
          <p class="text-muted-foreground text-center text-xs">
            Shipping and taxes calculated at checkout
          </p>
          <Button class="w-full" size="lg">
            Checkout
            <ChevronRightIcon class="ml-2 size-4" />
          </Button>
        </div>
      {/if}
    </Sheet.Content>
  </Sheet.Root>
</div>
