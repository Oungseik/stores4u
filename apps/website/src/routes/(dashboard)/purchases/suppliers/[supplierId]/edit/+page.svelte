<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { createQuery } from "@tanstack/svelte-query";

  import { goto } from "$app/navigation";
  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const supplierQuery = createQuery(() =>
    orpc.suppliers.get.queryOptions({
      input: { supplierId: params.supplierId },
    }),
  );

  const supplier = $derived(supplierQuery.data);

  // svelte-ignore non_reactive_update
  let supplierFormRef: SupplierForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Suppliers", href: `/purchases/suppliers` },
      { label: supplier?.name ?? "Supplier", href: `/purchases/suppliers/${params.supplierId}` },
      { label: "Edit" },
    ]}
  />

  {#if supplierQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if supplierQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load supplier</p>
    </div>
  {:else if supplier}
    <div class="max-w-2xl">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Edit Supplier</h1>
        <p class="text-muted-foreground text-sm">Update supplier details</p>
      </div>

      <SupplierForm
        bind:this={supplierFormRef}
        initialData={{
          action: "update",
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          phone2: supplier.phone2,
          email: supplier.email,
          address: supplier.address,
          paymentTerms: supplier.paymentTerms,
        }}
        onSuccess={() => goto(`/purchases/suppliers/${params.supplierId}`)}
      />

      <div class="flex items-center gap-2 border-t pt-4">
        <a
          href={`/purchases/suppliers/${params.supplierId}`}
          class={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </a>
        <Button
          onclick={() => supplierFormRef?.submit()}
          disabled={supplierFormRef?.getIsPending()}
        >
          {#if supplierFormRef?.getIsPending()}
            <Loader2Icon class="mr-2 size-4 animate-spin" />
            Updating...
          {:else}
            Update Supplier
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>
