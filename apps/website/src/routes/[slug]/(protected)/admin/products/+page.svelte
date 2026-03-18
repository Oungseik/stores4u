<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import { createInfiniteQuery } from "@tanstack/svelte-query";

  import Pricing from "$lib/components/Pricing.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  // State
  let searchQuery = $state("");
  let selectedCategory = $state<string | null>(null);

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  // Mock category filters - will be replaced with actual data
  const categoryFilters = [
    { value: null, label: "All Products", count: 24 },
    { value: "coffee", label: "Coffee", count: 12 },
    { value: "equipment", label: "Equipment", count: 8 },
    { value: "accessories", label: "Accessories", count: 4 },
  ];
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <div class="flex flex-col gap-2">
    <div class="flex h-9 items-center justify-between">
      <div class="flex items-center gap-1 lg:gap-2">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${shop.slug}/admin`}>Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Products</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <a href={`/${shop.slug}/admin/products/add`} class={buttonVariants()}>
        <PlusIcon class="size-4" />
        Add Product
      </a>
    </div>
  </div>

  {#if products.isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if products.isError}
    <div class="flex items-center justify-center py-12">
      <p class="text-red-500">Failed to load products</p>
    </div>
  {:else if allProducts.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
        <PackageIcon class="text-muted-foreground size-6" />
      </div>
      <p class="text-muted-foreground">No products found</p>
    </div>
  {:else}
    <!-- Filters and Search -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 items-center gap-2">
        <div class="relative max-w-md flex-1">
          <SearchIcon
            class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input placeholder="Search products, SKU..." class="pl-9" bind:value={searchQuery} />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}
          >
            <FilterIcon class="size-4" />
            {selectedCategory ?? "Filter Category"}
            <ChevronDownIcon class="size-3 opacity-50" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-48">
            <DropdownMenu.Label>Filter by Category</DropdownMenu.Label>
            <DropdownMenu.Separator />
            {#each categoryFilters as filter}
              <DropdownMenu.Item
                onclick={() => (selectedCategory = filter.value)}
                class="justify-between"
              >
                {filter.label}
                <span class="text-muted-foreground text-xs">{filter.count}</span>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {#if selectedCategory || searchQuery}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => {
              selectedCategory = null;
              searchQuery = "";
            }}
          >
            Clear filters
          </Button>
        {/if}
      </div>
    </div>

    <!-- Category Filter Pills -->
    <div class="flex flex-wrap gap-2">
      {#each categoryFilters as filter}
        <button
          type="button"
          class={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
            selectedCategory === filter.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          ]}
          onclick={() => (selectedCategory = filter.value)}
        >
          {filter.label}
          <span
            class={[
              "rounded-full px-1.5 py-0.5 text-[10px]",
              selectedCategory === filter.value ? "bg-primary-foreground/20" : "bg-background",
            ]}
          >
            {filter.count}
          </span>
        </button>
      {/each}
    </div>

    <div class="space-y-2">
      {#each allProducts as product (product.id)}
        <Card.Root class="overflow-hidden p-0">
          <Card.Content class="p-0">
            <div class="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2">
              <div class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <PackageIcon class="text-muted-foreground size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div>
                  <p class="truncate text-sm font-medium">{product.name}</p>

                  <div class="text-muted-foreground text-xs">
                    {product.sku}{product.categories?.length > 0
                      ? ` • ${product.categories[0]}`
                      : ""}
                  </div>
                </div>
              </div>

              <div>
                <Pricing
                  cents={product.priceCents}
                  country={shop.country}
                  priceClass="text-sm font-semibold"
                />
                <p class="text-muted-foreground text-xs">{product.stock} left</p>
              </div>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
                >
                  <MoreVerticalIcon class="text-muted-foreground size-4" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item>
                    <PencilIcon class="mr-2 size-4" />
                    Edit
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item class="text-destructive">
                    <Trash2Icon class="mr-2 size-4" />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    {#if products.hasNextPage}
      <div class="mt-4 flex justify-center">
        <Button
          variant="outline"
          onclick={() => products.fetchNextPage()}
          disabled={products.isFetchingNextPage}
        >
          {#if products.isFetchingNextPage}
            <Loader2Icon class="mr-2 size-4 animate-spin" />
            Loading...
          {:else}
            Load More
          {/if}
        </Button>
      </div>
    {/if}
  {/if}
</div>
