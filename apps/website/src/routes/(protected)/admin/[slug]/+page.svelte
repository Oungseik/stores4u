<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";

  import Pricing from "$lib/components/Pricing.svelte";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

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

  const shop = createQuery(() =>
    orpc.shops.get.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  let isDialogOpen = $state(false);

  let productFormRef: ProductForm;
</script>

<section class="p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold">Products</h2>
    <Dialog.Root bind:open={isDialogOpen}>
      <Dialog.Trigger class={["data-[state=open]:hidden", buttonVariants({ size: "sm" })]}>
        <PlusIcon class="size-4" />
        Add
      </Dialog.Trigger>
      <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <Dialog.Header>
          <Dialog.Title>Add New Product</Dialog.Title>
          <Dialog.Description>Create a new product for your shop.</Dialog.Description>
        </Dialog.Header>
        <ProductForm
          bind:this={productFormRef}
          slug={params.slug}
          onSuccess={() => {
            isDialogOpen = false;
          }}
          onCancel={() => {
            isDialogOpen = false;
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
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
                  country={shop.data?.country ?? null}
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
</section>
