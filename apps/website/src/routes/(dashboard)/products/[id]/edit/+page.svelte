<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";

  const { params, data }: PageProps = $props();

  // svelte-ignore non_reactive_update
  let productFormRef: ProductForm | null = null;

  const initialData = $derived({
    id: data.product.id,
    name: data.product.name,
    sku: data.product.sku,
    priceCents: data.product.priceCents,
    uom: data.product.uom,
    description: data.product.description,
    image: data.product.image,
    images: data.product.images,
    barcode: data.product.barcode,
    lowStockThreshold: data.product.lowStockThreshold,
    categoryIds: data.product.categoryIds,
  });
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_products(), href: `/products` },
      { label: data.product.name, href: `/products/${params.id}` },
      { label: msg.ui_edit() },
    ]}
  />

  <div class="max-w-2xl">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">{msg.ui_edit_product()}</h1>
      <p class="text-muted-foreground text-sm">{msg.ui_update_product_details()}</p>
    </div>

    <ProductForm
      bind:this={productFormRef}
      {initialData}
      onSuccess={() => goto(`/products/${params.id}`)}
    />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href={`/products/${params.id}`} class={buttonVariants({ variant: "outline" })}>
        {msg.ui_cancel()}
      </a>
      <Button onclick={() => productFormRef?.submit()} disabled={productFormRef?.getIsPending()}>
        {#if productFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {msg.ui_updating()}
        {:else}
          {msg.ui_update_product()}
        {/if}
      </Button>
    </div>
  </div>
</div>
