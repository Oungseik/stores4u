<script lang="ts">
  import ClockIcon from "@lucide/svelte/icons/clock";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { createInfiniteQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import {
    type PurchaseInvoiceItem,
    createColumns,
  } from "$lib/components/tables/purchase-invoices/columns";
  import { orpc } from "$lib/orpc_client";
  import { type PurchaseInvoiceStatus, purchaseInvoicesFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const columns = $derived(createColumns(shop.country));

  const searchParams = useSearchParams(purchaseInvoicesFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const statusOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "VALIDATED", label: "Validated" },
    { value: "AUTO_ACCEPTED", label: "Auto Accepted" },
    { value: "REJECTED", label: "Rejected" },
  ] satisfies { value: PurchaseInvoiceStatus; label: string }[];

  const purchaseInvoices = createInfiniteQuery(() =>
    orpc.purchaseInvoices.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        status: searchParams.status || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allPurchaseInvoices: PurchaseInvoiceItem[] = $derived(
    (purchaseInvoices.data?.pages.flatMap((page) => page.items) ?? []).map((inv) => ({
      id: inv.id,
      supplier: inv.supplier?.name ?? "—",
      date: inv.invoiceDate,
      status: inv.status,
      totalCents: inv.totalCents,
      items: inv.itemsCount,
      vatCents: inv.vatCents,
      discountCents: inv.discountCents,
      freightCents: inv.freightCents,
      subtotalCents: inv.subtotalCents,
    }))
  );

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.status.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", status: "" });
  }
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Invoices" },
    ]}
  >
    {#snippet actions()}
      <a href={`/${shop.slug}/admin/purchases/upload`} class={buttonVariants()}>
        <UploadIcon class="mr-2 size-4" />
        Upload Invoice
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p class="text-muted-foreground text-sm">Manage and track all supplier invoices</p>
      </div>
      <Button variant="outline">
        <DownloadIcon class="mr-2 size-4" />
        Export
      </Button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Total Invoices"
      value={0}
      description="All time"
      icon={ReceiptIcon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
    />
    <StatsCard
      title="Pending Review"
      value={0}
      description="Awaiting action"
      icon={ClockIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
    <StatsCard
      title="Validated"
      value={0}
      description="Approved invoices"
      icon={ReceiptIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
    />
    <StatsCard
      title="Total Value"
      value=""
      description="All invoices"
      icon={ReceiptIcon}
      iconBgClass="bg-blue-500/10"
      iconTextClass="text-blue-600"
      borderClass="from-blue-500/20 to-blue-500/5"
      price={0}
      country={shop.country}
    />
  </div>

  <!-- Filters -->
  <FilterBar.Root {hasFilters} onReset={resetFilters}>
    <FilterBar.Search
      placeholder="Search invoices, suppliers..."
      value={searchParams.search}
      oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
    />
    <FilterBar.Dropdown
      items={statusOptions}
      value={searchParams.status === "" ? null : searchParams.status}
      onValueChange={(status: PurchaseInvoiceStatus | null) =>
        status ? searchParams.update({ status }) : undefined}
      placeholder="All Statuses"
      label="Filter by Status"
    />
    <FilterBar.Reset />
  </FilterBar.Root>

  {#if purchaseInvoices.isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if purchaseInvoices.isError}
    <div class="flex items-center justify-center py-12">
      <p class="text-red-500">Failed to load invoices</p>
    </div>
  {:else}
    <!-- Invoices Table -->
    <DataTable {columns} data={allPurchaseInvoices} loading={false} />

    {#if purchaseInvoices.hasNextPage}
      <div class="mt-4 flex justify-center">
        <Button
          variant="outline"
          onclick={() => purchaseInvoices.fetchNextPage()}
          disabled={purchaseInvoices.isFetchingNextPage}
        >
          {#if purchaseInvoices.isFetchingNextPage}
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
