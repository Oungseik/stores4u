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
	import XIcon from "@lucide/svelte/icons/x";
	import { Badge } from "@repo/ui/badge";
	import { Button, buttonVariants } from "@repo/ui/button";
	import * as Card from "@repo/ui/card";
	import { Input } from "@repo/ui/input";
	import * as ScrollArea from "@repo/ui/scroll-area";
	import * as Separator from "@repo/ui/separator";
	import * as Sheet from "@repo/ui/sheet";
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
		logo: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200&h=200&fit=crop",
		banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=600&fit=crop",
		description: "Your local fresh produce market with the best organic selection",
		address: "123 Market Street, Downtown",
		phone: "+1 234 567 8900",
		hours: "Open until 9 PM",
		productCount: 150,
	};

	// GET /api/shops/:slug/categories
	const mockCategories = [
		{ id: "cat-1", name: "All", slug: "all", productCount: 24, emoji: "🏪" },
		{ id: "cat-2", name: "Fruits", slug: "fruits", productCount: 12, emoji: "🍎" },
		{ id: "cat-3", name: "Vegetables", slug: "vegetables", productCount: 8, emoji: "🥬" },
		{ id: "cat-4", name: "Dairy", slug: "dairy", productCount: 6, emoji: "🥛" },
		{ id: "cat-5", name: "Bakery", slug: "bakery", productCount: 4, emoji: "🍞" },
		{ id: "cat-6", name: "Beverages", slug: "beverages", productCount: 5, emoji: "🧃" },
	];

	// GET /api/shops/:slug/products
	const mockProducts = [
		{
			id: "prod-1",
			name: "Organic Apples",
			sku: "APL-001",
			description: "Fresh organic apples from local farms. Crisp, sweet, and juicy. Perfect for snacking or baking.",
			price: 4.99,
			originalPrice: 5.99,
			uom: "lb",
			images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop"],
			categoryIds: ["cat-2"],
			inStock: true,
			stockQty: 50,
			isSale: true,
		},
		{
			id: "prod-2",
			name: "Fresh Bananas",
			sku: "BAN-001",
			description: "Ripe and ready to eat bananas. Rich in potassium and perfect for smoothies.",
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
			description: "Fresh organic spinach leaves. Perfect for salads, smoothies, or cooking.",
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
			description: "Fresh whole milk from grass-fed cows. Rich in calcium and vitamins.",
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
			description: "Artisan sourdough bread baked fresh daily. Crusty outside, soft inside.",
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
			description: "Freshly squeezed orange juice. No added sugar or preservatives.",
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
			description: "Sweet and seedless red grapes. Perfect for snacking or wine making.",
			price: 3.99,
			uom: "lb",
			images: ["https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop"],
			categoryIds: ["cat-2"],
			inStock: true,
			stockQty: 35,
			isSale: true,
		},
		{
			id: "prod-8",
			name: "Fresh Carrots",
			sku: "CRT-001",
			description: "Organic carrots, freshly harvested. Great for snacking or cooking.",
			price: 2.49,
			uom: "bunch",
			images: ["https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop"],
			categoryIds: ["cat-3"],
			inStock: true,
			stockQty: 60,
		},
		{
			id: "prod-9",
			name: "Greek Yogurt",
			sku: "GYG-001",
			description: "Creamy Greek yogurt packed with protein. Perfect for breakfast.",
			price: 5.49,
			originalPrice: 6.99,
			uom: "cup",
			images: ["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop"],
			categoryIds: ["cat-4"],
			inStock: true,
			stockQty: 20,
			isSale: true,
		},
		{
			id: "prod-10",
			name: "Croissants",
			sku: "CRO-001",
			description: "Buttery French croissants, freshly baked this morning.",
			price: 3.99,
			uom: "2 pack",
			images: ["https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop"],
			categoryIds: ["cat-5"],
			inStock: true,
			stockQty: 12,
		},
		{
			id: "prod-11",
			name: "Strawberry Smoothie Mix",
			sku: "SSM-001",
			description: "Pre-mixed strawberry smoothie blend. Just add milk!",
			price: 4.99,
			uom: "pack",
			images: ["https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop"],
			categoryIds: ["cat-6", "cat-2"],
			inStock: false,
			stockQty: 0,
		},
		{
			id: "prod-12",
			name: "Broccoli",
			sku: "BRD-002",
			description: "Fresh green broccoli crowns. High in vitamins and fiber.",
			price: 2.99,
			uom: "bunch",
			images: ["https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop"],
			categoryIds: ["cat-3"],
			inStock: true,
			stockQty: 45,
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
	let displayedProductCount = $state(8);
	let isLoadingMore = $state(false);

	// Cart state - TODO: POST /api/cart, GET /api/cart
	let cartItems = $state<Array<{ product: (typeof mockProducts)[0]; quantity: number }>>([]);

	// Wishlist state - TODO: GET /api/wishlist, POST /api/wishlist
	let wishlistIds = $state<Set<string>>(new Set(["prod-3", "prod-7"]));

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

	let displayedProducts = $derived(filteredProducts.slice(0, displayedProductCount));

	let hasMoreProducts = $derived(displayedProductCount < filteredProducts.length);

	let cartTotal = $derived(
		cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
	);

	let cartItemCount = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));

	// ============================================
	// ACTIONS
	// ============================================

	async function loadMoreProducts() {
		if (isLoadingMore || !hasMoreProducts) return;
		isLoadingMore = true;
		
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 500));
		
		displayedProductCount = Math.min(displayedProductCount + 4, filteredProducts.length);
		isLoadingMore = false;
	}

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
	<!-- Header -->
	<header
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur"
	>
		<div class="flex h-14 items-center justify-between px-4">
			<button type="button" class="-ml-2 p-2 lg:hidden">
				<MenuIcon class="size-5" />
			</button>

			<div class="flex items-center gap-2">
				<img src={mockShop.logo} alt={mockShop.name} class="h-8 w-8 rounded-full object-cover" />
				<span class="hidden text-lg font-semibold sm:block">{mockShop.name}</span>
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
		<img src={mockShop.banner} alt={mockShop.name} class="h-full w-full object-cover" />
		<div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70"></div>
		
		<div class="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
			<div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm sm:mb-4 sm:h-20 sm:w-20">
				<img src={mockShop.logo} alt={mockShop.name} class="h-full w-full rounded-full object-cover" />
			</div>
			
			<h1 class="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">{mockShop.name}</h1>
			
			<p class="mb-4 max-w-md text-sm text-white/80 sm:text-base md:mb-6">
				{mockShop.description}
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3 text-xs text-white/70 sm:text-sm">
				<span class="flex items-center gap-1">
					<MapPinIcon class="size-3.5 sm:size-4" />
					{mockShop.address}
				</span>
				<span class="hidden sm:inline">•</span>
				<span class="flex items-center gap-1">
					<PhoneIcon class="size-3.5 sm:size-4" />
					{mockShop.phone}
				</span>
			</div>

			<div class="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
				<Badge class="bg-white/20 text-white backdrop-blur-sm">
					{mockShop.productCount}+ Products
				</Badge>
				<Badge class="bg-green-500/80 text-white backdrop-blur-sm">
					Free Delivery
				</Badge>
			</div>
		</div>
	</section>

	<!-- Category Filters - Tab Style -->
	<div class="sticky top-14 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
		<ScrollArea.Root class="w-full">
			<div class="flex gap-1 px-2 py-2 sm:gap-2 sm:px-4">
				{#each mockCategories as category}
					<button
						type="button"
						class={buttonVariants({
							variant: selectedCategory === category.id ? "default" : "ghost",
							class: "h-9 px-3 text-sm sm:h-10 sm:px-4 relative",
						})}
						onclick={() => (selectedCategory = category.id)}
					>
						<span class="mr-1.5 text-base">{category.emoji}</span>
						<span>{category.name}</span>
						<span class="ml-1.5 text-xs opacity-60">({category.productCount})</span>
						
						{#if selectedCategory === category.id}
							<div class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"></div>
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
					{mockCategories.find(c => c.id === selectedCategory)?.name || "All Products"}
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
			<div class="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
				{#each displayedProducts as product (product.id)}
					<Card.Root
						class="group relative flex flex-col overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-lg"
					>
						<!-- Image Container -->
						<div
							class="bg-muted relative aspect-[4/3] w-full cursor-pointer overflow-hidden"
							onclick={() => openProductModal(product)}
							onkeydown={(e) => e.key === 'Enter' && openProductModal(product)}
							role="button"
							tabindex="0"
						>
							<img
								src={product.images[0]}
								alt={product.name}
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
							
							<!-- Overlay on hover -->
							<div class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"></div>

							<!-- Wishlist Button -->
							<button
								type="button"
								class="bg-background/90 hover:bg-background absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
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

							<!-- Sale Badge -->
							{#if product.isSale && product.originalPrice}
								<div class="absolute top-2 left-2 flex items-center gap-0.5 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
									{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
								</div>
							{/if}

							<!-- Out of Stock Overlay -->
							{#if !product.inStock}
								<div class="absolute inset-0 flex items-center justify-center bg-black/50">
									<span class="rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground">
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
								<h3 class="line-clamp-2 text-sm font-semibold leading-tight sm:text-base">
									{product.name}
								</h3>
							</button>
							
							<p class="mt-1 text-xs text-muted-foreground">{product.uom}</p>

							<div class="mt-auto flex flex-col gap-2 pt-2">
								<div class="flex items-baseline gap-2">
									<span class="text-lg font-bold sm:text-xl">
										${product.price.toFixed(2)}
									</span>
									{#if product.originalPrice}
										<span class="text-xs text-muted-foreground line-through sm:text-sm">
											${product.originalPrice.toFixed(2)}
										</span>
									{/if}
								</div>

								<!-- Stock indicator -->
								<div class="flex items-center gap-1.5">
									<span class="h-1.5 w-1.5 rounded-full {product.inStock ? 'bg-green-500' : 'bg-red-500'}"></span>
									<span class="text-xs {product.inStock ? 'text-green-600' : 'text-red-500'}">
										{product.inStock ? `In Stock (${product.stockQty})` : 'Out of Stock'}
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

	<!-- Product Detail Modal -->
	<Sheet.Root open={isProductModalOpen} onOpenChange={(open) => !open && closeProductModal()}>
		<Sheet.Content
			side="bottom"
			class="h-[90vh] rounded-t-2xl sm:top-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:rounded-2xl"
		>
			<Sheet.Header class="flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
				<Sheet.Title class="text-xl font-bold">Product Details</Sheet.Title>
			</Sheet.Header>

			{#if selectedProduct}
				<ScrollArea.Root class="h-full px-4 sm:px-6">
					<div class="space-y-6 py-4 sm:py-6">
						<!-- Product Image -->
						<div class="bg-muted relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-xl sm:float-left sm:mb-0 sm:w-5/12 sm:max-w-none">
							<img
								src={selectedProduct.images[0]}
								alt={selectedProduct.name}
								class="h-full w-full object-cover"
							/>
							
							{#if selectedProduct.isSale && selectedProduct.originalPrice}
								<div class="absolute top-3 left-3 flex items-center gap-0.5 rounded-md bg-red-500 px-3 py-1.5 text-sm font-bold text-white">
									{Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}% OFF
								</div>
							{/if}
						</div>

						<!-- Product Info -->
						<div class="sm:float-right sm:w-7/12 sm:pl-6">
							<div class="flex items-start justify-between gap-3">
								<h2 class="text-2xl font-bold">{selectedProduct.name}</h2>
								<button
									type="button"
									class="hover:bg-muted flex-shrink-0 rounded-full p-2"
									onclick={() => selectedProduct && toggleWishlist(selectedProduct.id)}
								>
									<HeartIcon
										class="size-6 transition-colors {wishlistIds.has(selectedProduct.id)
											? 'fill-red-500 text-red-500'
											: 'text-muted-foreground'}"
									/>
								</button>
							</div>

							<p class="mt-1 text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>

							<div class="mt-4 flex items-baseline gap-3">
								<span class="text-3xl font-bold">${selectedProduct.price.toFixed(2)}</span>
								<span class="text-muted-foreground">/ {selectedProduct.uom}</span>
								{#if selectedProduct.originalPrice}
									<span class="text-muted-foreground line-through">
										${selectedProduct.originalPrice.toFixed(2)}
									</span>
								{/if}
							</div>

							<div class="mt-3 flex items-center gap-2">
								{#if selectedProduct?.inStock}
									<Badge variant="secondary" class="gap-1.5">
										<span class="h-2 w-2 rounded-full bg-green-500"></span>
										In Stock ({selectedProduct?.stockQty} available)
									</Badge>
								{:else}
									<Badge variant="destructive" class="gap-1.5">
										<span class="h-2 w-2 rounded-full bg-white"></span>
										Out of Stock
									</Badge>
								{/if}
							</div>

							<Separator.Root class="my-5" />

							<p class="text-muted-foreground leading-relaxed">
								{selectedProduct.description}
							</p>

							<div class="mt-6 flex gap-3">
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
											<span class="w-12 text-center text-lg font-semibold">
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
										class="flex-1 gap-2"
										onclick={() => selectedProduct && addToCart(selectedProduct)}
									>
										<ShoppingCartIcon class="size-5" />
										{cartItems.find((item) => item.product.id === selectedProduct?.id)
											? "Add More"
											: "Add to Cart"}
									</Button>
								{:else}
									<Button class="flex-1" disabled>Out of Stock</Button>
								{/if}
							</div>
						</div>
						
						<div class="clear-both"></div>
					</div>
				</ScrollArea.Root>
			{/if}
		</Sheet.Content>
	</Sheet.Root>

	<!-- Cart Drawer -->
	<Sheet.Root open={isCartOpen} onOpenChange={(open) => (isCartOpen = open)}>
		<Sheet.Content side="right" class="flex w-full flex-col sm:w-96">
			<Sheet.Header class="flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
				<Sheet.Title class="flex items-center gap-2 text-xl">
					<ShoppingCartIcon class="size-6" />
					Your Cart
				</Sheet.Title>
				<Sheet.Description class="mt-1">
					{cartItems.length === 0
						? "Your cart is empty"
						: `${cartItemCount} item(s) in your cart`}
				</Sheet.Description>
			</Sheet.Header>

			{#if cartItems.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
					<div class="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
						<ShoppingCartIcon class="text-muted-foreground size-10" />
					</div>
					<p class="text-center text-lg font-medium">Your cart is empty</p>
					<p class="text-muted-foreground text-center text-sm">Start shopping to add items to your cart</p>
					<Button variant="outline" onclick={() => (isCartOpen = false)}>Browse Products</Button>
				</div>
			{:else}
				<ScrollArea.Root class="flex-1 px-4 sm:px-6">
					<div class="space-y-4 py-4">
						{#each cartItems as item (item.product.id)}
							<div class="flex gap-3 rounded-lg border p-3">
								<div class="bg-muted h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
									<img
										src={item.product.images[0]}
										alt={item.product.name}
										class="h-full w-full object-cover"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<h4 class="truncate font-medium">{item.product.name}</h4>
									<p class="text-sm text-muted-foreground">
										${item.product.price.toFixed(2)} / {item.product.uom}
									</p>
									<div class="mt-2 flex items-center justify-between">
										<div class="flex items-center gap-1">
											<Button
												size="icon"
												variant="outline"
												class="h-8 w-8"
												onclick={() => updateCartQuantity(item.product.id, -1)}
											>
												<MinusIcon class="size-3.5" />
											</Button>
											<span class="w-8 text-center font-medium">{item.quantity}</span>
											<Button
												size="icon"
												variant="outline"
												class="h-8 w-8"
												onclick={() => updateCartQuantity(item.product.id, 1)}
											>
												<PlusIcon class="size-3.5" />
											</Button>
										</div>
										<Button
											size="sm"
											variant="ghost"
											class="h-8 text-red-500 hover:bg-red-50 hover:text-red-600"
											onclick={() => removeFromCart(item.product.id)}
										>
											Remove
										</Button>
									</div>
								</div>
								<div class="flex flex-col items-end justify-between">
									<span class="font-semibold">
										${(item.product.price * item.quantity).toFixed(2)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea.Root>

				<div class="flex-shrink-0 space-y-4 border-t bg-background p-4 sm:p-6">
					<div class="flex items-center justify-between">
						<span class="text-lg font-medium">Subtotal</span>
						<span class="text-2xl font-bold">${cartTotal.toFixed(2)}</span>
					</div>
					<p class="text-center text-xs text-muted-foreground">
						Shipping and taxes calculated at checkout
					</p>
					<Button class="w-full gap-2" size="lg">
						Proceed to Checkout
						<ChevronRightIcon class="size-5" />
					</Button>
				</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
</div>
