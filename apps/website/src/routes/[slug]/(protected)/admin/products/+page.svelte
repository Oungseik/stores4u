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
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { productsFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const searchParams = useSearchParams(productsFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedCategories = new Debounced(() => searchParams.categories, 1000);

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        categories:
          debouncedCategories.current.length > 0 ? debouncedCategories.current : undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);
  const categories = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { slug: params.slug, pageSize: 100 },
      enabled: !!params.slug,
    })
  );

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.categories.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", categories: [] });
  }
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Products" }]}
  >
    {#snippet actions()}
      <a href={`/${shop.slug}/admin/products/add`} class={buttonVariants()}>
        <PlusIcon class="size-4" />
        Add Product
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Filters and Search -->
  <div class="flex flex-col items-center items-start justify-start gap-2 lg:flex-row">
    <div class="flex w-full items-center gap-2 lg:max-w-md">
      <div class="relative w-full">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search products, SKU..."
          class="pl-9"
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <FilterIcon class="size-4" />
          {searchParams.categories.length > 0
            ? `${searchParams.categories.length} categories selected`
            : "All Categories"}
          <ChevronDownIcon class="size-3 opacity-50" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-56">
          <DropdownMenu.Label>Filter by Category</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#if categories.data?.items}
            <DropdownMenu.CheckboxGroup
              value={searchParams.categories}
              onValueChange={(value: string[]) => searchParams.update({ categories: value })}
            >
              {#each categories.data.items as category (category.id)}
                <DropdownMenu.CheckboxItem value={category.name}>
                  <span class="flex-1">{category.name}</span>
                  <span class="text-muted-foreground text-xs">{category.productCount}</span>
                </DropdownMenu.CheckboxItem>
              {/each}
            </DropdownMenu.CheckboxGroup>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if hasFilters}
        <Button variant="ghost" size="sm" onclick={resetFilters}>
          <XIcon class="size-4" />
          Reset
        </Button>
      {/if}
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
                    {#snippet child()}
                      <a
                        class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
                        href={`/${params.slug}/admin/products/${product.id}/edit`}
                      >
                        <PencilIcon class="mr-2 size-4" />
                        Edit
                      </a>
                    {/snippet}
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
