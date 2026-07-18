<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
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
  import { SvelteSet } from "svelte/reactivity";
  import { toast } from "svelte-sonner";

  import type { CategoryItem } from "$lib/components/tables/categories/columns";
  import { orpc } from "$lib/orpc_client";

  interface Props {
    open: boolean;
    onClose: () => void;
    category: CategoryItem;
  }

  let { open, onClose, category }: Props = $props();

  let productSearch = $state("");
  const selectedProductIds = new SvelteSet<string>();
  let initialProductIdsLoaded = $state(false);

  const queryClient = useQueryClient();

  const categoryProducts = createQuery(() =>
    orpc.categories.getProducts.queryOptions({
      input: {
        categoryId: category.id,
      },
      enabled: open,
    }),
  );

  const debouncedProductSearch = new Debounced(() => productSearch, 300);

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 50,
        cursor,
        search: debouncedProductSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: open,
    }),
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  $effect(() => {
    if (categoryProducts.data && !initialProductIdsLoaded) {
      for (const productId of categoryProducts.data.productIds) selectedProductIds.add(productId);
      initialProductIdsLoaded = true;
    }
  });

  const updateCategoryProductsMutation = createMutation(() =>
    orpc.categories.updateProducts.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_products_updated_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
        onClose();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_update_products"));
      },
    }),
  );

  function handleUpdateCategoryProducts() {
    updateCategoryProductsMutation.mutate({
      categoryId: category.id,
      productIds: Array.from(selectedProductIds),
    });
  }

  function toggleProduct(productId: string) {
    if (selectedProductIds.has(productId)) {
      selectedProductIds.delete(productId);
    } else {
      selectedProductIds.add(productId);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="flex max-h-[85vh] flex-col px-0 sm:max-w-2xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Manage Products — {category.name}</Dialog.Title>
      <Dialog.Description>{msg.ui_add_or_remove_products_from_this_category()}</Dialog.Description>
    </Dialog.Header>

    <div class="px-3 sm:px-4">
      <div class="relative mb-3">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder={msg.ui_search_products()}
          value={productSearch}
          oninput={(e) => (productSearch = e.currentTarget.value)}
          class="pl-9"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 sm:px-4">
      {#if categoryProducts.isLoading || products.isLoading}
        <div class="flex items-center justify-center py-8">
          <Loader2Icon class="text-muted-foreground size-5 animate-spin" />
        </div>
      {:else if allProducts.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <p class="text-muted-foreground text-sm">
            {debouncedProductSearch.current
              ? msg.ui_no_products_found()
              : msg.ui_no_products_available()}
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
                {msg.ui_loading_b04ba49()}
              {:else}
                {msg.ui_load_more()}
              {/if}
            </Button>
          </div>
        {/if}
      {/if}
    </div>

    <Dialog.Footer class="mx-0 mt-4">
      <Button variant="outline" onclick={() => handleOpenChange(false)}>{msg.ui_cancel()}</Button>
      <Button
        onclick={handleUpdateCategoryProducts}
        disabled={updateCategoryProductsMutation.isPending}
      >
        {#if updateCategoryProductsMutation.isPending}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {msg.ui_saving()}
        {:else}
          {selectedProductIds.size === 1
            ? msg.ui_save_one_product()
            : msg.ui_save_products({ count: selectedProductIds.size })}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
