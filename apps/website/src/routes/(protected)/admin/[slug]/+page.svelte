<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { createInfiniteQuery } from "@tanstack/svelte-query";

  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  function formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)}`;
  }

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);
</script>

<section class="overflow-y-auto p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold">Products</h2>
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
    <div class="space-y-1.5">
      {#each allProducts as product (product.id)}
        <Card.Root class="overflow-hidden p-0">
          <Card.Content class="p-0">
            <button
              type="button"
              class="hover:bg-muted/50 justi flex w-full items-center gap-2.5 px-3 py-2 text-left"
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

              <span class="text-muted-foreground text-xs">{product.inStock} left</span>

              <p class="text-sm font-semibold">{formatPrice(product.priceCents)}</p>
              <ChevronRightIcon class="text-muted-foreground size-4 shrink-0" />
            </button>
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
