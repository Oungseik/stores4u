<script lang="ts">
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";

  import { goto } from "$app/navigation";
  import ProductForm from "$lib/components/forms/ProductForm.svelte";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
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
        <!-- <p class="text-muted-foreground text-sm font-medium">Create a new product for your shop</p> -->
      </div>
    </div>
  </div>

  <div class="max-w-2xl px-4 lg:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">Add New Product</h1>
      <p class="text-muted-foreground mt-1 text-sm">Create a new product for your shop</p>
    </div>
    <ProductForm slug={params.slug} onSuccess={() => goto("..")} onCancel={() => goto("..")} />
  </div>
</section>
