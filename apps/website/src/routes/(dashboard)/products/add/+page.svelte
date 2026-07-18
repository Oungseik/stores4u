<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  // svelte-ignore non_reactive_update
  let productFormRef: ProductForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_products(), href: `/products` },
      { label: msg.ui_add_product() },
    ]}
  />

  <div class="max-w-2xl">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">{msg.ui_add_product()}</h1>
      <p class="text-muted-foreground text-sm">{msg.ui_create_a_new_product_for_your_shop()}</p>
    </div>

    <ProductForm bind:this={productFormRef} onSuccess={() => goto(`/products`)} />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href="/products" class={buttonVariants({ variant: "outline" })}> {msg.ui_cancel()} </a>
      <Button onclick={() => productFormRef?.submit()} disabled={productFormRef?.getIsPending()}>
        {#if productFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {msg.ui_creating()}
        {:else}
          {msg.ui_create_product()}
        {/if}
      </Button>
    </div>
  </div>
</div>
