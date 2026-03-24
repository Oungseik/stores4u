<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { suppliersFilterSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  type ApiSupplier = {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    paymentTerms: string | null;
    invoicesCount: number;
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

  // State
  let selectedSupplier = $state<ApiSupplier | null>(null);
  let isViewOpen = $state(false);
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  // svelte-ignore non_reactive_update
  let addFormRef: SupplierForm | null = null;
  // svelte-ignore non_reactive_update
  let editFormRef: SupplierForm | null = null;

  const supplierDetails = createQuery(() =>
    orpc.suppliers.get.queryOptions({
      input: { slug: params.slug, supplierId: selectedSupplier?.id ?? "" },
      enabled: isViewOpen && !!selectedSupplier?.id,
    })
  );

  const displaySupplier = $derived(supplierDetails.data ?? selectedSupplier);

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  // Stats
  const stats = $derived(() => {
    const total = allSuppliers.length;
    const totalPurchases = allSuppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
    const totalInvoices = allSuppliers.reduce((sum, s) => sum + s.invoicesCount, 0);
    const avgInvoices = total > 0 ? Math.round(totalInvoices / total) : 0;

    return { total, totalPurchases, totalInvoices, avgInvoices };
  });

  function viewSupplier(supplier: ApiSupplier) {
    selectedSupplier = supplier;
    isViewOpen = true;
  }

  function editSupplier(supplier: ApiSupplier) {
    selectedSupplier = supplier;
    isEditOpen = true;
  }

  function deleteSupplier(supplierId: string) {
    // Mock: Delete supplier
    alert(`Delete supplier ${supplierId}`);
  }
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
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

  <!-- Page Title -->
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p class="text-muted-foreground text-sm">Manage supplier information and relationships</p>
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Total Suppliers"
      value={stats().total}
      description="Active suppliers"
      icon={Building2Icon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
    />
    <StatsCard
      title="Total Purchases"
      value=""
      description="All time"
      icon={DollarSignIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
      price={stats().totalPurchases}
      country={shop.country}
    />
    <StatsCard
      title="Total Invoices"
      value={stats().totalInvoices}
      description="From all suppliers"
      icon={ReceiptIcon}
      iconBgClass="bg-blue-500/10"
      iconTextClass="text-blue-600"
      borderClass="from-blue-500/20 to-blue-500/5"
    />
    <StatsCard
      title="Avg Invoices"
      value={stats().avgInvoices}
      description="Per supplier"
      icon={FileTextIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
  </div>

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
        {hasFilters ? "Try adjusting your search terms" : "Add your first supplier to get started"}
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
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class={buttonVariants({ variant: "ghost", size: "icon" }) +
                    " size-8 opacity-0 group-hover:opacity-100"}
                >
                  <MoreVerticalIcon class="size-4" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item onclick={() => viewSupplier(supplier)}>
                    <EyeIcon class="size-4" />
                    View Details
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onclick={() => editSupplier(supplier)}>
                    <PencilIcon class="size-4" />
                    Edit
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    class="text-red-600"
                    onclick={() => deleteSupplier(supplier.id)}
                  >
                    <Trash2Icon class="size-4" />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
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
                <p class="font-semibold">{supplier.invoicesCount}</p>
              </div>
            </div>

            {#if supplier.lastPurchase}
              <div class="text-muted-foreground flex items-center gap-2 text-xs">
                <ReceiptIcon class="size-3" />
                Last purchase: {formatDate(supplier.lastPurchase)}
              </div>
            {/if}
          </Card.Content>
          <Card.Footer class="pt-0">
            <Button variant="outline" class="w-full" onclick={() => viewSupplier(supplier)}>
              View Details
            </Button>
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
</div>

<!-- View Supplier Dialog -->
<Dialog.Root bind:open={isViewOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    {#if displaySupplier}
      <Dialog.Header>
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <Building2Icon class="text-primary size-5" />
          </div>
          <div>
            <Dialog.Title class="text-xl">{displaySupplier.name}</Dialog.Title>
            <Dialog.Description>Supplier details and history</Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <div class="grid gap-6 py-4">
        <!-- Contact Info -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Contact Information
          </h4>
          <div class="space-y-2 rounded-md border p-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Contact Person</span>
              <span class="font-medium">{displaySupplier.contactName ?? "—"}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Phone</span>
              <span>{displaySupplier.phone ?? "—"}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Email</span>
              <span>{displaySupplier.email ?? "—"}</span>
            </div>
            <div class="flex items-start justify-between">
              <span class="text-muted-foreground">Address</span>
              <span class="max-w-xs text-right">{displaySupplier.address ?? "—"}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Payment Terms</span>
              <span class="font-medium">{displaySupplier.paymentTerms ?? "—"}</span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Purchase History
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">
                <Pricing cents={displaySupplier.totalPurchases} country={shop.country} />
              </p>
              <p class="text-muted-foreground text-xs">Total Purchases</p>
            </div>
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">{displaySupplier.invoicesCount}</p>
              <p class="text-muted-foreground text-xs">Invoices</p>
            </div>
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">
                {displaySupplier.lastPurchase ? formatDate(displaySupplier.lastPurchase) : "—"}
              </p>
              <p class="text-muted-foreground text-xs">Last Purchase</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity Placeholder -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Recent Invoices
          </h4>
          <div class="text-muted-foreground rounded-md border p-3 text-center text-sm">
            <p>View all invoices from this supplier on the invoices page</p>
            <Button variant="outline" class="mt-2" size="sm">View Invoices</Button>
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (isViewOpen = false)}>Close</Button>
        <Button
          onclick={() => {
            if (displaySupplier) {
              isViewOpen = false;
              editSupplier(displaySupplier);
            }
          }}
        >
          <PencilIcon class="size-4" />
          Edit Supplier
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Add Supplier Dialog -->
<Dialog.Root
  bind:open={isAddOpen}
  onOpenChange={(open) => {
    if (!open) addFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
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
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
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
            selectedSupplier = null;
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
