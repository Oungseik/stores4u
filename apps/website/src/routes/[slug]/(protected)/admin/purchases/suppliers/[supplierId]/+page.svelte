<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as Dialog from "@repo/ui/dialog";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import Pricing from "$lib/components/Pricing.svelte";
  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.suppliers.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete supplier");
      },
    })
  );

  const supplierQuery = createQuery(() =>
    orpc.suppliers.get.queryOptions({
      input: { slug: params.slug, supplierId: params.supplierId },
    })
  );

  const supplier = $derived(supplierQuery.data);

  let isEditOpen = $state(false);
  // svelte-ignore non_reactive_update
  let editFormRef: SupplierForm | null = null;

  function deleteSupplier() {
    if (!supplier) return;
    confirmDelete({
      title: "Delete Supplier",
      description: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ slug: params.slug, id: supplier.id });
        window.history.back();
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Suppliers", href: `/${shop.slug}/admin/purchases/suppliers` },
      { label: supplier?.name ?? "Supplier" },
    ]}
  >
    {#snippet actions()}
      {#if supplier}
        <Button variant="destructive" onclick={deleteSupplier}>
          <Trash2Icon class="size-4" />
          Delete
        </Button>
        <Button variant="outline" onclick={() => (isEditOpen = true)}>
          <PencilIcon class="size-4" />
          Edit
        </Button>
      {/if}
    {/snippet}
  </AdminDashboardHeader>

  {#if supplierQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if supplierQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load supplier</p>
    </div>
  {:else if supplier}
    <section class="max-w-2xl space-y-6">
      <div class="flex items-center gap-4">
        <div class="bg-primary/10 flex size-14 items-center justify-center rounded-full">
          <Building2Icon class="text-primary size-7" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{supplier.name}</h1>
          {#if supplier.contactName}
            <p class="text-muted-foreground text-sm">{supplier.contactName}</p>
          {/if}
        </div>
      </div>

      <div>
        <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Contact Information
        </h4>
        <div class="space-y-2 rounded-md border p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Contact Person</span>
            <span class="font-medium">{supplier.contactName ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Phone</span>
            <span>{supplier.phone ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Email</span>
            <span>{supplier.email ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">Address</span>
            <span class="max-w-xs text-right">{supplier.address ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Payment Terms</span>
            <span class="font-medium">{supplier.paymentTerms ?? "—"}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Purchase History
        </h4>
        <div class="space-y-2 rounded-md border p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Total Purchases</span>
            <span class="font-medium">
              <Pricing cents={supplier.totalPurchases} country={shop.country} />
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Total Invoices</span>
            <span class="font-medium">{supplier.purchaseInvoicesCount}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Last Purchase</span>
            <span class="font-medium">
              {supplier.lastPurchase ? formatDate(supplier.lastPurchase) : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<!-- Edit Supplier Dialog -->
<Dialog.Root
  bind:open={isEditOpen}
  onOpenChange={(open) => {
    if (!open) editFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    {#if supplier}
      <Dialog.Header>
        <Dialog.Title>Edit Supplier</Dialog.Title>
        <Dialog.Description>Update supplier information</Dialog.Description>
      </Dialog.Header>

      {#key supplier.id}
        <SupplierForm
          bind:this={editFormRef}
          slug={params.slug}
          initialData={{
            action: "update",
            id: supplier.id,
            name: supplier.name,
            contactName: supplier.contactName,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            paymentTerms: supplier.paymentTerms,
          }}
          onSuccess={() => {
            isEditOpen = false;
            editFormRef?.resetForm();
            queryClient.invalidateQueries({
              queryKey: orpc.suppliers.get.key({
                input: { slug: params.slug, supplierId: params.supplierId },
              }),
            });
          }}
          onCancel={() => {
            isEditOpen = false;
            editFormRef?.resetForm();
          }}
        />
      {/key}
    {/if}
  </Dialog.Content>
</Dialog.Root>
