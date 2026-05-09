<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { createQuery } from "@tanstack/svelte-query";

  import ProductForm from "$lib/components/forms/ProductForm.svelte";
  import { orpc } from "$lib/orpc_client";

  interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    productId?: string;
  }

  let { open, onClose, slug, productId }: Props = $props();

  // svelte-ignore non_reactive_update
  let productFormRef: ProductForm | null = null;

  const productQuery = createQuery(() => ({
    ...orpc.products.get.queryOptions({
      input: { slug, id: productId },
      enabled: !!productId && open,
    }),
  }));

  // svelte-ignore state_referenced_locally
  const isEditMode = !!productId;

  const initialData = $derived(
    productQuery.data && isEditMode
      ? {
          id: productQuery.data.id,
          name: productQuery.data.name,
          sku: productQuery.data.sku,
          priceCents: productQuery.data.priceCents,
          uom: productQuery.data.uom,
          description: productQuery.data.description,
          image: productQuery.data.image,
          images: productQuery.data.images,
          barcode: productQuery.data.barcode,
          lowStockThreshold: productQuery.data.lowStockThreshold,
          categoryIds: productQuery.data.categories.map((c) => c.id),
        }
      : undefined
  );

  function handleOpenChange(value: boolean) {
    if (!value) {
      productFormRef?.resetForm();
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>{isEditMode ? "Edit Product" : "Add Product"}</Dialog.Title>
      <Dialog.Description>
        {isEditMode ? "Update product details" : "Create a new product for your shop"}
      </Dialog.Description>
    </Dialog.Header>

    <ScrollArea class="max-h-[70vh] px-3 sm:px-4">
      {#if isEditMode && productQuery.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if isEditMode && productQuery.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">Failed to load product</p>
        </div>
      {:else}
        <ProductForm bind:this={productFormRef} {slug} {initialData} onSuccess={onClose} />
      {/if}
    </ScrollArea>

    <Dialog.Footer class="mx-0">
      <Button variant="outline" onclick={onClose}>Cancel</Button>
      <Button onclick={() => productFormRef?.submit()} disabled={productFormRef?.getIsPending()}>
        {#if productFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {isEditMode ? "Updating..." : "Creating..."}
        {:else}
          {isEditMode ? "Update Product" : "Create Product"}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
