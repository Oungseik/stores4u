<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
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
    productId?: string;
  }

  let { open, onClose, productId }: Props = $props();

  // svelte-ignore non_reactive_update
  let productFormRef: ProductForm | null = null;

  const productQuery = createQuery(() => ({
    ...orpc.products.get.queryOptions({
      input: { id: productId },
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
      : undefined,
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
      <Dialog.Title>{isEditMode ? msg.ui_edit_product() : msg.ui_add_product()}</Dialog.Title>
      <Dialog.Description>
        {isEditMode ? msg.ui_update_product_details() : msg.ui_create_a_new_product_for_your_shop()}
      </Dialog.Description>
    </Dialog.Header>

    <ScrollArea class="max-h-[70vh] px-3 sm:px-4">
      {#if isEditMode && productQuery.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if isEditMode && productQuery.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">{msg.ui_failed_to_load_product()}</p>
        </div>
      {:else}
        <ProductForm bind:this={productFormRef} {initialData} onSuccess={onClose} />
      {/if}
    </ScrollArea>

    <Dialog.Footer class="mx-0">
      <Button variant="outline" onclick={onClose}>{msg.ui_cancel()}</Button>
      <Button onclick={() => productFormRef?.submit()} disabled={productFormRef?.getIsPending()}>
        {#if productFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {isEditMode ? msg.ui_updating() : msg.ui_creating()}
        {:else}
          {isEditMode ? msg.ui_update_product() : msg.ui_create_product()}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
