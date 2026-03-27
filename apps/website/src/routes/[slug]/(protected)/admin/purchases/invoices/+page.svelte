<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { createInfiniteQuery, createQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/purchase-invoices/columns";
  import { orpc } from "$lib/orpc_client";
  import { type PurchaseInvoiceStatus, purchaseInvoicesFilterSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  let selectedInvoiceId = $state<string | null>(null);
  let isDetailsOpen = $state(false);

  const invoiceDetails = createQuery(() =>
    orpc.purchaseInvoices.get.queryOptions({
      input: { slug: params.slug, invoiceId: selectedInvoiceId! },
      enabled: !!selectedInvoiceId,
    })
  );

  function openInvoiceDetails(id: string) {
    selectedInvoiceId = id;
    isDetailsOpen = true;
  }

  const columns = $derived(createColumns(shop.country, params.slug, openInvoiceDetails));

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

  const allPurchaseInvoices = $derived(
    purchaseInvoices.data?.pages.flatMap((page) => page.items) ?? []
  );

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.status.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", status: "" });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Invoices" },
    ]}
  >
    {#snippet actions()}
      <div class="flex items-center justify-between gap-2">
        <Button variant="outline">
          <DownloadIcon class="size-4" />
          Export
        </Button>
        <a href={`/${shop.slug}/admin/purchases/upload`} class={buttonVariants()}>
          <UploadIcon class="size-4" />
          Upload Invoice
        </a>
      </div>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Invoices</h1>
    <p class="text-muted-foreground text-sm">Manage and track all supplier invoices</p>
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

  <section class="mt-4 space-y-6">
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
  </section>
</div>

<Dialog.Root bind:open={isDetailsOpen}>
  <Dialog.Content class="flex max-h-[90vh] flex-col">
    {#if invoiceDetails.isLoading}
      <div class="flex items-center justify-center py-16">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if invoiceDetails.data}
      {@const invoice = invoiceDetails.data}
      {@const statusConfig: Record<string, { class: string; label: string }> = {
        VALIDATED: { class: "text-emerald-600", label: "Validated" },
        PENDING: { class: "text-amber-600", label: "Pending" },
        AUTO_ACCEPTED: { class: "text-blue-600", label: "Auto Accepted" },
        REJECTED: { class: "text-red-600", label: "Rejected" },
      }}
      {@const cfg = statusConfig[invoice.status] ?? {
        class: "text-gray-600",
        label: invoice.status,
      }}
      <Dialog.Header class="flex-shrink-0">
        <Dialog.Title class="text-xl">{invoice.invoiceNumber}</Dialog.Title>
        <Dialog.Description>
          Invoice from {invoice.supplier?.name ?? "—"} · {formatDate(invoice.invoiceDate)}
        </Dialog.Description>
      </Dialog.Header>

      <div class="h-[66vh] overflow-hidden">
        <ScrollArea class="h-full pr-2.5">
          <div class="grid gap-6 py-4">
            <!-- Invoice Info -->
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Invoice Information
              </h4>
              <div class="space-y-2 rounded-md border p-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Invoice Number</span>
                  <span class="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Date</span>
                  <span>{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Status</span>
                  <span class={cfg.class + " font-medium"}>{cfg.label}</span>
                </div>
                {#if invoice.validatedAt}
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Validated</span>
                    <span>{formatDate(invoice.validatedAt, true)}</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Supplier -->
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Supplier
              </h4>
              <div class="flex items-center gap-2.5 rounded-md border p-2.5 text-sm">
                <div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
                  <Building2Icon class="text-primary size-4" />
                </div>
                <div>
                  <p class="font-medium">{invoice.supplier?.name ?? "—"}</p>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Invoice Items
              </h4>
              <div class="rounded-md border text-sm">
                {#each invoice.items as item, i}
                  <div
                    class="flex items-center justify-between p-2.5 {i !== invoice.items.length - 1
                      ? 'border-b'
                      : ''}"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="bg-muted flex size-8 items-center justify-center rounded">
                        <PackageIcon class="text-muted-foreground size-4" />
                      </div>
                      <div>
                        <p>{item.product?.name ?? "—"}</p>
                        <p class="text-muted-foreground text-xs">{item.product?.sku ?? "—"}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-muted-foreground text-xs">x {item.qty}</p>
                      <Pricing cents={item.lineTotalCents} country={shop.country} />
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Financial Summary -->
            <div>
              <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Financial Summary
              </h4>
              <div class="space-y-1.5 rounded-md border p-2.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Subtotal</span>
                  <Pricing cents={invoice.subtotalCents} country={shop.country} />
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">VAT</span>
                  <Pricing cents={invoice.vatCents} country={shop.country} />
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Discount</span>
                  <Pricing cents={invoice.discountCents} country={shop.country} />
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Freight</span>
                  <Pricing cents={invoice.freightCents} country={shop.country} />
                </div>
                <div class="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <Pricing cents={invoice.totalCents} country={shop.country} />
                </div>
              </div>
            </div>

            {#if invoice.notes}
              <div>
                <h4
                  class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase"
                >
                  Notes
                </h4>
                <div class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  {invoice.notes}
                </div>
              </div>
            {/if}
          </div>
        </ScrollArea>
      </div>

      <Dialog.Footer class="flex-shrink-0 gap-2">
        <Button variant="outline" onclick={() => (isDetailsOpen = false)}>Close</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
