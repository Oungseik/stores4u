<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import { buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <div class="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Add New Product</h1>
      <p class="text-muted-foreground">Create a new product for your shop.</p>
    </div>
    <a class={buttonVariants({ variant: "outline" })} href={`/${params.slug}/admin/products`}>
      <ArrowLeftIcon class="size-4" />
      Back to Products
    </a>
  </div>

  <div class="bg-card rounded-lg border p-6 shadow-sm">
    <ProductForm slug={params.slug} onSuccess={() => goto("..")} onCancel={() => goto("..")} />
  </div>
</section>
