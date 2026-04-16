<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import * as Dialog from "@repo/ui/dialog";
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
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{isEditMode ? "Edit Product" : "Add Product"}</Dialog.Title>
      <Dialog.Description>
        {isEditMode ? "Update product details" : "Create a new product for your shop"}
      </Dialog.Description>
    </Dialog.Header>

    {#if isEditMode && productQuery.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if isEditMode && productQuery.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load product</p>
      </div>
    {:else}
      <ProductForm
        bind:this={productFormRef}
        {slug}
        {initialData}
        onSuccess={onClose}
        onCancel={onClose}
      />
    {/if}
  </Dialog.Content>
</Dialog.Root>
