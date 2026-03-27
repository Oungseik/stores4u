<script lang="ts">
  import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SearchIcon from "@lucide/svelte/icons/search";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/purchase-invoice-files/columns";
  import { orpc } from "$lib/orpc_client";
  import { type InvoiceFileStatus, invoiceFilesFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const queryClient = useQueryClient();

  let processingFileId = $state<string | null>(null);

  const searchParams = useSearchParams(invoiceFilesFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 500);

  const statusOptions = [
    { value: "UPLOADED", label: "Uploaded" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PROCESSED", label: "Ready to Review" },
    { value: "FAILED", label: "Failed" },
    { value: "REVIEWED", label: "Reviewed" },
  ] satisfies { value: InvoiceFileStatus; label: string }[];

  const invoiceFiles = createInfiniteQuery(() =>
    orpc.purchaseInvoices.listFiles.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
        status: searchParams.status || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allFiles = $derived(invoiceFiles.data?.pages.flatMap((page) => page.items) ?? []);

  const filteredFiles = $derived.by(() => {
    const search = debouncedSearch.current?.toLowerCase();
    if (!search) return allFiles;
    return allFiles.filter((file) => file.filename.toLowerCase().includes(search));
  });

  const stats = $derived.by(() => {
    const files = allFiles;
    return {
      total: files.length,
      pending: files.filter((f) => f.status === "UPLOADED").length,
      processing: files.filter((f) => f.status === "PROCESSING").length,
      readyToReview: files.filter((f) => f.status === "PROCESSED").length,
      reviewed: files.filter((f) => f.status === "REVIEWED").length,
    };
  });

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.status.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", status: "" });
  }

  const processMutation = createMutation(() =>
    orpc.purchaseInvoices.processFile.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice processed successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        processingFileId = null;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to process invoice");
        processingFileId = null;
      },
    })
  );

  function handleProcessFile(fileId: string) {
    processingFileId = fileId;
    processMutation.mutateAsync({ slug: params.slug, fileId });
  }

  const columns = $derived(createColumns(params.slug, handleProcessFile, processingFileId));
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Invoice Files" },
    ]}
  >
    {#snippet actions()}
      <div class="flex items-center justify-between gap-2">
        <a href={`/${shop.slug}/admin/purchases/upload`} class={buttonVariants()}>
          <UploadIcon class="size-4" />
          Upload Invoice
        </a>
      </div>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Invoice Files</h1>
    <p class="text-muted-foreground text-sm">Upload, process, and review supplier invoices</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Total Files"
      value={stats.total}
      description="All uploaded"
      icon={FileTextIcon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
    />
    <StatsCard
      title="Pending"
      value={stats.pending}
      description="Awaiting processing"
      icon={ClockIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
    <StatsCard
      title="Ready to Review"
      value={stats.readyToReview}
      description="Processed files"
      icon={SearchIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
    />
    <StatsCard
      title="Reviewed"
      value={stats.reviewed}
      description="Completed"
      icon={CheckCircleIcon}
      iconBgClass="bg-blue-500/10"
      iconTextClass="text-blue-600"
      borderClass="from-blue-500/20 to-blue-500/5"
    />
  </div>

  <section class="mt-4 space-y-6">
    <!-- Filters -->
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <FilterBar.Search
        placeholder="Search by filename..."
        value={searchParams.search}
        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
      />
      <FilterBar.Dropdown
        items={statusOptions}
        value={searchParams.status === "" ? null : searchParams.status}
        onValueChange={(status: InvoiceFileStatus | null) =>
          status ? searchParams.update({ status }) : undefined}
        placeholder="All Statuses"
        label="Filter by Status"
      />
      <FilterBar.Reset />
    </FilterBar.Root>

    {#if invoiceFiles.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if invoiceFiles.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load invoice files</p>
      </div>
    {:else}
      <!-- Invoice Files Table -->
      <DataTable {columns} data={filteredFiles} loading={false} />

      {#if invoiceFiles.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => invoiceFiles.fetchNextPage()}
            disabled={invoiceFiles.isFetchingNextPage}
          >
            {#if invoiceFiles.isFetchingNextPage}
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
