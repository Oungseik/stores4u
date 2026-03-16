<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href={`/${params.slug}/admin`}>Dashboard</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href={`/${params.slug}/admin/products`}>Products</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>Add Product</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <Button variant="outline" href={`/${params.slug}/admin/products`} class="gap-2">
        <ArrowLeftIcon class="size-4" />
        Back to Products
      </Button>
    </div>
    <p class="text-sm font-medium text-muted-foreground">Create a new product for your shop</p>
  </div>

  <div class="bg-card rounded-lg border p-6 shadow-sm">
    <ProductForm slug={params.slug} onSuccess={() => goto("..")} onCancel={() => goto("..")} />
  </div>
</section>
