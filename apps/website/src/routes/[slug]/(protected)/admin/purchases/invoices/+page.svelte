<script lang="ts">
  import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import SearchIcon from "@lucide/svelte/icons/search";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
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
  let isUploadDialogOpen = $state(false);
  let isDragging = $state(false);
  let isUploading = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();
  let isDeleteDialogOpen = $state(false);
  let fileIdToDelete = $state<string | null>(null);

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

  const uploadMutation = createMutation(() =>
    orpc.purchaseInvoices.uploadFile.mutationOptions({
      onSuccess: () => {
        toast.success("File uploaded successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        isUploadDialogOpen = false;
        isUploading = false;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload file");
        isUploading = false;
      },
    })
  );

  const deleteMutation = createMutation(() =>
    orpc.purchaseInvoices.deleteFile.mutationOptions({
      onSuccess: () => {
        toast.success("File deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        isDeleteDialogOpen = false;
        fileIdToDelete = null;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete file");
      },
    })
  );

  const downloadMutation = createMutation(() =>
    orpc.purchaseInvoices.downloadFile.mutationOptions({
      onSuccess: (data) => {
        window.open(data.downloadUrl, "_blank");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate download link");
      },
    })
  );

  function handleProcessFile(fileId: string) {
    processingFileId = fileId;
    processMutation.mutateAsync({ slug: params.slug, fileId });
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileUpload(input.files[0]);
    }
    input.value = "";
  }

  async function handleFileUpload(file: File) {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG) or PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    isUploading = true;

    try {
      await uploadMutation.mutateAsync({ slug: params.slug, file });
    } finally {
      isUploading = false;
    }
  }

  function handleDeleteFile(id: string) {
    fileIdToDelete = id;
    isDeleteDialogOpen = true;
  }

  async function handleConfirmDelete() {
    if (!fileIdToDelete) return;
    await deleteMutation.mutateAsync({ slug: params.slug, fileId: fileIdToDelete });
  }

  async function handleDownloadFile(fileId: string) {
    downloadMutation.mutate(
      { slug: params.slug, fileId },
      {
        onSuccess: (data) => window.open(data.downloadUrl, "_blank"),
        onError: (e) => toast(e.message),
      }
    );
  }

  const columns = $derived(
    createColumns(
      params.slug,
      handleProcessFile,
      processingFileId,
      handleDeleteFile,
      handleDownloadFile
    )
  );
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
        <Button onclick={() => (isUploadDialogOpen = true)}>
          <UploadIcon class="size-4" />
          Upload Invoice
        </Button>
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

<Dialog.Root bind:open={isUploadDialogOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-lg overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Upload Invoice</Dialog.Title>
      <Dialog.Description>Upload a supplier invoice for OCR processing</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div
        class="rounded-lg border-2 border-dashed p-8 transition-all duration-200 {isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && fileInput?.click()}
      >
        <div class="flex flex-col items-center justify-center gap-4 text-center">
          {#if isUploading}
            <div class="flex flex-col items-center gap-4">
              <div class="bg-primary/10 flex size-16 items-center justify-center rounded-full">
                <Loader2Icon class="text-primary size-8 animate-spin" />
              </div>
              <div>
                <p class="text-lg font-semibold">Uploading...</p>
                <p class="text-muted-foreground mt-1 text-sm">Please wait</p>
              </div>
            </div>
          {:else}
            <div class="bg-primary/10 flex size-16 items-center justify-center rounded-full">
              <UploadIcon class="text-primary size-8" />
            </div>
            <div>
              <p class="text-lg font-semibold">Drop your invoice here</p>
              <p class="text-muted-foreground mt-1 text-sm">or click to browse files</p>
            </div>
            <div class="text-muted-foreground text-xs">
              <p>Supported formats: JPG, PNG, PDF</p>
              <p>Maximum file size: 10MB</p>
            </div>
            <input
              bind:this={fileInput}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              class="hidden"
              onchange={handleFileInput}
            />
            <Button onclick={() => fileInput?.click()}>
              <UploadIcon class="mr-2 size-4" />
              Select File
            </Button>
          {/if}
        </div>
      </div>

      <Card.Root>
        <Card.Header class="pb-2">
          <Card.Title class="text-base">Tips for Best Results</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="text-muted-foreground list-disc space-y-1.5 pl-4 text-sm">
            <li>Ensure the invoice is well-lit and in focus</li>
            <li>Capture the entire invoice including header and totals</li>
            <li>Make sure all text is clearly visible and not blurred</li>
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={isDeleteDialogOpen}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Invoice File</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this invoice file? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isDeleteDialogOpen = false)}>Cancel</Button>
      <Button
        variant="destructive"
        onclick={handleConfirmDelete}
        disabled={deleteMutation.isPending}
      >
        {#if deleteMutation.isPending}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
        {/if}
        Delete
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
