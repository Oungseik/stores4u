<script lang="ts">
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/products/columns";
  import { orpc } from "$lib/orpc_client";
  import { type ProductsView, productsFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams(productsFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedCategories = new Debounced(() => searchParams.categories, 1000);

  const deleteMutation = createMutation(() =>
    orpc.products.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete product");
      },
    })
  );

  function handleDeleteProduct(id: string) {
    confirmDelete({
      title: "Delete Product",
      description: "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ slug: params.slug, id });
      },
    });
  }

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

  const columns = $derived(createColumns(shop.country, params.slug, handleDeleteProduct));
  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.categories.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", categories: [] });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: "Dashboard", href: `/${shop.slug}/admin` }, { label: "Products" }]}
  >
    {#snippet actions()}
      <a href={`/${shop.slug}/admin/products/add`} class={buttonVariants()}>
        <PlusIcon class="size-4" /> Add Product
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <section class="mt-4 space-y-6">
    <!-- Filters and Search -->
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex items-center justify-start gap-4">
        <FilterBar.Search
          placeholder="Search products, SKU..."
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />

        <FilterBar.CheckboxGroup
          items={(categories.data?.items ?? []).map((c) => ({
            value: c.name,
            label: c.name,
            count: c.productCount,
          }))}
          value={searchParams.categories}
          onValueChange={(value) => searchParams.update({ categories: value })}
          placeholder="All Categories"
        />

        <FilterBar.Reset />
      </div>

      <ToggleGroup
        type="single"
        value={searchParams.view}
        onValueChange={(value) => {
          if (value && (value === "card" || value === "table")) {
            searchParams.update({ view: value as ProductsView });
          }
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="card" aria-label="Card view">
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <ListIcon class="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </FilterBar.Root>

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
    {:else if searchParams.view === "table"}
      <DataTable
        {columns}
        data={allProducts}
        loading={false}
        onRowClick={(product) => goto(`/${params.slug}/admin/products/${product.id}`)}
      />

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
    {:else}
      <div class="space-y-2">
        {#each allProducts as product (product.id)}
          <Card.Root class="overflow-hidden p-0">
            <Card.Content class="p-0">
              <div class="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2">
                <a
                  href={`/${params.slug}/admin/products/${product.id}`}
                  class="flex min-w-0 flex-1 items-center gap-2.5"
                >
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
                    <p class="text-muted-foreground text-right text-xs">{product.stock} left</p>
                  </div>
                </a>

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
                          class={buttonVariants({
                            variant: "ghost",
                            class: "w-full justify-start",
                          })}
                          href={`/${params.slug}/admin/products/${product.id}/edit`}
                        >
                          <PencilIcon class="size-4" />
                          Edit
                        </a>
                      {/snippet}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-destructive"
                      onclick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2Icon class="size-4" />
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
  </section>
</div>
