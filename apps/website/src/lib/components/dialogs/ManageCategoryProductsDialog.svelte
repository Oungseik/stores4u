<script lang="ts">
  import FolderIcon from "@lucide/svelte/icons/folder";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { Button } from "@repo/ui/button";
  import { Checkbox } from "@repo/ui/checkbox";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { toast } from "svelte-sonner";

  import type { CategoryItem } from "$lib/components/tables/categories/columns";
  import { orpc } from "$lib/orpc_client";

  interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    category: CategoryItem;
  }

  let { open, onClose, slug, category }: Props = $props();

  let productSearch = $state("");
  let selectedProductIds = $state<Set<string>>(new Set());
  let initialProductIdsLoaded = $state(false);

  const queryClient = useQueryClient();

  const categoryProducts = createQuery(() =>
    orpc.categories.getProducts.queryOptions({
      input: {
        slug,
        categoryId: category.id,
      },
      enabled: open,
    })
  );

  const debouncedProductSearch = new Debounced(() => productSearch, 300);

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 50,
        cursor,
        slug,
        search: debouncedProductSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: open,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  $effect(() => {
    if (categoryProducts.data && !initialProductIdsLoaded) {
      selectedProductIds = new Set(categoryProducts.data.productIds);
      initialProductIdsLoaded = true;
    }
  });

  const updateCategoryProductsMutation = createMutation(() =>
    orpc.categories.updateProducts.mutationOptions({
      onSuccess: () => {
        toast.success("Products updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update products");
      },
    })
  );

  function handleUpdateCategoryProducts() {
    updateCategoryProductsMutation.mutate({
      slug,
      categoryId: category.id,
      productIds: Array.from(selectedProductIds),
    });
  }

  function toggleProduct(productId: string) {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    selectedProductIds = next;
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="flex max-h-[85vh] max-w-2xl flex-col">
    <Dialog.Header>
      <Dialog.Title>Manage Products — {category.name}</Dialog.Title>
      <Dialog.Description>Add or remove products from this category</Dialog.Description>
    </Dialog.Header>

    <div class="relative mb-3">
      <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        placeholder="Search products..."
        value={productSearch}
        oninput={(e) => (productSearch = e.currentTarget.value)}
        class="pl-9"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      {#if categoryProducts.isLoading || products.isLoading}
        <div class="flex items-center justify-center py-8">
          <Loader2Icon class="text-muted-foreground size-5 animate-spin" />
        </div>
      {:else if allProducts.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <p class="text-muted-foreground text-sm">
            {debouncedProductSearch.current ? "No products found" : "No products available"}
          </p>
        </div>
      {:else}
        <div class="space-y-1">
          {#each allProducts as product (product.id)}
            <label
              class="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2"
            >
              <Checkbox
                checked={selectedProductIds.has(product.id)}
                onCheckedChange={() => toggleProduct(product.id)}
              />
              <div class="flex flex-1 items-center gap-3">
                {#if product.image}
                  <img
                    src={product.image}
                    alt={product.name}
                    class="size-10 rounded-md object-cover"
                  />
                {:else}
                  <div class="bg-muted flex size-10 items-center justify-center rounded-md">
                    <FolderIcon class="text-muted-foreground size-5" />
                  </div>
                {/if}
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{product.name}</p>
                  <p class="text-muted-foreground text-xs">
                    {product.sku}{#if product.stock !== undefined}
                      · Stock: {product.stock}{/if}
                  </p>
                </div>
              </div>
            </label>
          {/each}
        </div>

        {#if products.hasNextPage}
          <div class="mt-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
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

    <Dialog.Footer class="mt-4">
      <Button variant="outline" onclick={() => handleOpenChange(false)}>Cancel</Button>
      <Button
        onclick={handleUpdateCategoryProducts}
        disabled={updateCategoryProductsMutation.isPending}
      >
        {#if updateCategoryProductsMutation.isPending}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Saving...
        {:else}
          Save ({selectedProductIds.size} product{selectedProductIds.size === 1 ? "" : "s"})
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
