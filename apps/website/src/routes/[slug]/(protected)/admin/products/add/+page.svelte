<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import { Button } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
</script>

<section class="p-4">
  <div class="mb-6">
    <Button variant="ghost" size="sm" href=".." class="mb-4 -ml-2 flex items-center gap-1">
      <ArrowLeftIcon class="size-4" />
      Back to Products
    </Button>
    <h2 class="text-xl font-semibold">Add New Product</h2>
    <p class="text-muted-foreground mt-1 text-sm">Create a new product for your shop.</p>
  </div>

  <div class="bg-card rounded-lg border p-6 shadow-sm">
    <ProductForm slug={params.slug} onSuccess={() => goto("..")} onCancel={() => goto("..")} />
  </div>
</section>
