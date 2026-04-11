<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as Dialog from "@repo/ui/dialog";
  import * as FilterBar from "@repo/ui/filter-bar";
  import {
    createInfiniteQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import Pricing from "$lib/components/Pricing.svelte";
  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { suppliersFilterSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.suppliers.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.get.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete supplier");
      },
    })
  );

  type ApiSupplier = {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    paymentTerms: string | null;
    purchaseInvoicesCount: number;
    totalPurchases: number;
    lastPurchase: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const searchParams = useSearchParams(suppliersFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const suppliers = createInfiniteQuery(() =>
    orpc.suppliers.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 6,
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allSuppliers = $derived(suppliers.data?.pages.flatMap((page) => page.items) ?? []);

  let selectedSupplier = $state<ApiSupplier | null>(null);
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  // svelte-ignore non_reactive_update
  let addFormRef: SupplierForm | null = null;
  // svelte-ignore non_reactive_update
  let editFormRef: SupplierForm | null = null;

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  function editSupplier(supplier: ApiSupplier) {
    selectedSupplier = supplier;
    isEditOpen = true;
  }

  function deleteSupplier(supplier: ApiSupplier) {
    confirmDelete({
      title: "Delete Supplier",
      description: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ slug: params.slug, id: supplier.id });
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Suppliers" },
    ]}
  >
    {#snippet actions()}
      <Button onclick={() => (isAddOpen = true)}>
        <PlusIcon class="size-4" />
        Add Supplier
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Suppliers</h1>
    <p class="text-muted-foreground text-sm">Manage supplier information and relationships</p>
  </div>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <FilterBar.Search
        placeholder="Search suppliers by name, contact, or email..."
        value={searchParams.search}
        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
      />
      <FilterBar.Reset />
    </FilterBar.Root>

    {#if suppliers.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if suppliers.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load suppliers</p>
      </div>
    {:else if allSuppliers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Building2Icon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">No suppliers found</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? "Try adjusting your search terms"
            : "Add your first supplier to get started"}
        </p>
        {#if !hasFilters}
          <Button class="mt-4" onclick={() => (isAddOpen = true)}>
            <PlusIcon class="size-4" />
            Add Supplier
          </Button>
        {/if}
      </div>
    {:else}
      <!-- Suppliers Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each allSuppliers as supplier (supplier.id)}
          <Card.Root class="group transition-all duration-200 hover:shadow-md">
            <Card.Header class="pb-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                    <Building2Icon class="text-primary size-5" />
                  </div>
                  <div>
                    <Card.Title class="text-base">{supplier.name}</Card.Title>
                    {#if supplier.contactName}
                      <Card.Description class="flex items-center gap-1">
                        <UserIcon class="size-3" />
                        {supplier.contactName}
                      </Card.Description>
                    {/if}
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Content class="space-y-3">
              <div class="space-y-1 text-sm">
                {#if supplier.email}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <MailIcon class="size-3" />
                    <span class="truncate">{supplier.email}</span>
                  </div>
                {/if}
                {#if supplier.phone}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon class="size-3" />
                    <span>{supplier.phone}</span>
                  </div>
                {/if}
              </div>

              <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">Total Purchases</p>
                  <p class="font-semibold">
                    <Pricing cents={supplier.totalPurchases} country={shop.country} />
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-xs">Invoices</p>
                  <p class="font-semibold">{supplier.purchaseInvoicesCount}</p>
                </div>
              </div>

              {#if supplier.lastPurchase}
                <div class="text-muted-foreground flex items-center gap-2 text-xs">
                  <ReceiptIcon class="size-3" />
                  Last purchase: {formatDate(supplier.lastPurchase)}
                </div>
              {/if}
            </Card.Content>
            <Card.Footer class="flex flex-col gap-2 pt-0">
              <Button
                variant="outline"
                class="w-full"
                href={`/${params.slug}/admin/purchases/suppliers/${supplier.id}`}
              >
                View Details
              </Button>
              <div class="flex w-full gap-2">
                <Button
                  variant="destructive"
                  class="flex-1"
                  onclick={() => deleteSupplier(supplier)}
                >
                  <Trash2Icon class="size-4" />
                  Delete
                </Button>
                <Button variant="outline" class="flex-1" onclick={() => editSupplier(supplier)}>
                  <PencilIcon class="size-4" />
                  Edit
                </Button>
              </div>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>

      {#if suppliers.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => suppliers.fetchNextPage()}
            disabled={suppliers.isFetchingNextPage}
          >
            {#if suppliers.isFetchingNextPage}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Loading...
            {:else}
              Load More
            {/if}
          </Button>
        </div>
      {/if}
    {/if}
  </section>
</div>

<!-- Add Supplier Dialog -->
<Dialog.Root
  bind:open={isAddOpen}
  onOpenChange={(open) => {
    if (!open) addFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Add New Supplier</Dialog.Title>
      <Dialog.Description>Create a new supplier in your system</Dialog.Description>
    </Dialog.Header>

    <SupplierForm
      bind:this={addFormRef}
      slug={params.slug}
      onSuccess={() => {
        isAddOpen = false;
        addFormRef?.resetForm();
      }}
      onCancel={() => {
        isAddOpen = false;
        addFormRef?.resetForm();
      }}
    />
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Supplier Dialog -->
<Dialog.Root
  bind:open={isEditOpen}
  onOpenChange={(open) => {
    if (!open) editFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    {#if selectedSupplier}
      <Dialog.Header>
        <Dialog.Title>Edit Supplier</Dialog.Title>
        <Dialog.Description>Update supplier information</Dialog.Description>
      </Dialog.Header>

      {#key selectedSupplier.id}
        <SupplierForm
          bind:this={editFormRef}
          slug={params.slug}
          initialData={{
            action: "update",
            id: selectedSupplier.id,
            name: selectedSupplier.name,
            contactName: selectedSupplier.contactName,
            phone: selectedSupplier.phone,
            email: selectedSupplier.email,
            address: selectedSupplier.address,
            paymentTerms: selectedSupplier.paymentTerms,
          }}
          onSuccess={() => {
            isEditOpen = false;
            editFormRef?.resetForm();
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
