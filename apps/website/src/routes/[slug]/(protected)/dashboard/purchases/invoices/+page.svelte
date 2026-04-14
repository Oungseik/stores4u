<script lang="ts">
  import DownloadIcon from "@lucide/svelte/icons/download";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ImageIcon from "@lucide/svelte/icons/image";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import type { PurchaseInvoiceFileStatus } from "@repo/db";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FileDropZone from "@repo/ui/file-drop-zone";
  import * as FilterBar from "@repo/ui/filter-bar";
  import * as Progress from "@repo/ui/progress";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import StatusCell from "$lib/components/tables/purchase-invoice-files/cells/StatusCell.svelte";
  import { createColumns } from "$lib/components/tables/purchase-invoice-files/columns";
  import { orpc } from "$lib/orpc_client";
  import { type InvoiceFilesView, invoiceFilesFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const queryClient = useQueryClient();

  let disabledFileDropZone = $state(false);
  let processingFileId = $state<string | null>(null);
  let isUploadDialogOpen = $state(false);
  let uploadProgress = $state({ current: 0, total: 0 });

  const searchParams = useSearchParams(invoiceFilesFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 500);
  // JSON.stringify via $derived prevents false reactive triggers:
  // useSearchParams re-parses arrays from URL on every read (new reference each time),
  // and update() writes #localCache twice (direct + URL sync). $derived with string
  // comparison deduplicates these, so Debounced only fires when the value actually changes.
  const statusesKey = $derived(JSON.stringify(searchParams.statuses ?? []));
  const debouncedStatuses = new Debounced(() => statusesKey, 500);

  const statusKeys: PurchaseInvoiceFileStatus[] = [
    "UPLOADED",
    "PROCESSING",
    "PROCESSED",
    "FAILED",
    "REVIEWED",
    "REJECTED",
  ];

  const statusLabels: Record<PurchaseInvoiceFileStatus, string> = {
    UPLOADED: "Uploaded",
    PROCESSING: "Processing",
    PROCESSED: "Ready to Review",
    FAILED: "Failed",
    REVIEWED: "Reviewed",
    REJECTED: "Rejected",
  };

  const invoiceFilesStats = createQuery(() =>
    orpc.purchaseInvoices.getStats.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const statusOptions = $derived(
    statusKeys.map((key) => ({
      value: key satisfies string,
      label: statusLabels[key],
      count: invoiceFilesStats.data?.[key] ?? 0,
    }))
  );

  const invoiceFiles = createInfiniteQuery(() =>
    orpc.purchaseInvoices.listFiles.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
        statuses: (() => {
          const s = JSON.parse(debouncedStatuses.current) as PurchaseInvoiceFileStatus[];
          return s.length > 0 ? s : undefined;
        })(),
        search: debouncedSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allFiles = $derived(invoiceFiles.data?.pages.flatMap((page) => page.items) ?? []);
  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.statuses.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", statuses: [] });
  }

  const processMutation = createMutation(() =>
    orpc.purchaseInvoices.processFile.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice processed successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getStats.key() });
        processingFileId = null;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to process invoice");
        processingFileId = null;
      },
    })
  );

  const uploadMutation = createMutation(() => orpc.purchaseInvoices.uploadFile.mutationOptions());

  const deleteMutation = createMutation(() =>
    orpc.purchaseInvoices.deleteFile.mutationOptions({
      onSuccess: () => {
        toast.success("File deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getStats.key() });
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

  async function handleUpload(files: File[]) {
    disabledFileDropZone = true;
    uploadProgress = { current: 0, total: files.length };

    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(
      files.map((file, i) =>
        uploadMutation
          .mutateAsync({ slug: params.slug, file })
          .then((result) => {
            uploadProgress = { current: i + 1, total: files.length };
            successCount++;
            return result;
          })
          .catch((error) => {
            uploadProgress = { current: i + 1, total: files.length };
            failCount++;
            toast.error(`${file.name}: ${error.message || "Failed to upload"}`);
            throw error;
          })
      )
    );

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
      queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getStats.key() });
    }

    uploadProgress = { current: 0, total: 0 };
    disabledFileDropZone = false;

    if (failCount === 0) {
      isUploadDialogOpen = false;
    }
  }

  function handleDeleteFile(id: string) {
    confirmDelete({
      title: "Delete Invoice File",
      description:
        "Are you sure you want to delete this invoice file? This action cannot be undone.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ slug: params.slug, fileId: id });
      },
    });
  }

  function handleDownloadFile(fileId: string) {
    downloadMutation.mutate({ slug: params.slug, fileId });
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

  function getFileTypeLabel(fileType: string): string {
    if (fileType === "application/pdf") return "PDF";
    if (fileType.startsWith("image/")) return "Image";
    return fileType;
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/dashboard` },
      { label: "Purchases", href: `/${shop.slug}/dashboard/purchases` },
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

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Invoice Files</h1>
    <p class="text-muted-foreground text-sm">Upload, process, and review supplier invoices</p>
  </div>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder="Search by filename..."
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
        <FilterBar.CheckboxGroup
          items={statusOptions}
          value={searchParams.statuses}
          onValueChange={(value) =>
            searchParams.update({ statuses: value as PurchaseInvoiceFileStatus[] })}
          placeholder="All Statuses"
        />
        <FilterBar.Reset />
      </div>

      <ToggleGroup
        type="single"
        value={searchParams.view}
        onValueChange={(value) => {
          if (value && (value === "card" || value === "table")) {
            searchParams.update({ view: value as InvoiceFilesView });
          }
        }}
        variant="outline"
        size="sm"
        class="shrink-0"
      >
        <ToggleGroupItem value="card" aria-label="Card view">
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <ListIcon class="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </FilterBar.Root>

    {#if invoiceFiles.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if invoiceFiles.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load invoice files</p>
      </div>
    {:else if allFiles.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
          <FileTextIcon class="text-muted-foreground size-6" />
        </div>
        <p class="text-muted-foreground">No invoice files found</p>
      </div>
    {:else if searchParams.view === "table"}
      <DataTable {columns} data={allFiles} loading={false} />

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
    {:else}
      <div class="space-y-2">
        {#each allFiles as file (file.id)}
          <Card.Root class="overflow-hidden p-0">
            <Card.Content class="p-0">
              <div class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5">
                <a
                  href={`/${params.slug}/dashboard/purchases/invoices/${file.id}${file.status === "REJECTED" ? "/review" : ""}`}
                  class="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div
                    class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    {#if file.fileType.startsWith("image/")}
                      <ImageIcon class="text-primary size-5" />
                    {:else}
                      <FileTextIcon class="text-primary size-5" />
                    {/if}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-medium">{file.filename}</p>
                      <div class="hidden sm:block">
                        <StatusCell status={file.status} />
                      </div>
                    </div>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      <span>{getFileTypeLabel(file.fileType)}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      {#if file.confidenceScore !== null}
                        <span>•</span>
                        <span>{Math.round(file.confidenceScore * 100)}% confidence</span>
                      {/if}
                      {#if file.status === "REJECTED" && file.rejectionReason}
                        <span>•</span>
                        <span
                          class="text-destructive max-w-[200px] truncate"
                          title={file.rejectionReason}>{file.rejectionReason}</span
                        >
                      {/if}
                      <span class="sm:hidden">•</span>
                      <span class="sm:hidden"
                        >{statusOptions.find((s) => s.value === file.status)?.label ??
                          file.status}</span
                      >
                    </div>
                  </div>
                </a>

                <div class="flex shrink-0 items-center gap-1.5">
                  {#if file.status === "PROCESSING" || processingFileId === file.id}
                    <div class="text-muted-foreground flex items-center gap-1.5">
                      <Loader2Icon class="size-4 animate-spin" />
                      <span class="hidden text-sm sm:inline">Processing...</span>
                    </div>
                  {/if}

                  {#if file.status !== "PROCESSING" && processingFileId !== file.id}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger
                        class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
                        onclick={(e) => e.stopPropagation()}
                      >
                        <MoreVerticalIcon class="text-muted-foreground size-4" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item>
                          {#snippet child()}
                            <a
                              href={`/${params.slug}/dashboard/purchases/invoices/${file.id}${file.status === "REJECTED" ? "/review" : ""}`}
                              class={buttonVariants({
                                variant: "ghost",
                                class: "w-full justify-start px-2!",
                              })}
                            >
                              <SearchIcon class="text-muted-foreground size-4" />
                              <span
                                >{file.status === "REVIEWED" || file.status === "REJECTED"
                                  ? "View Details"
                                  : "Review"}</span
                              >
                            </a>
                          {/snippet}
                        </DropdownMenu.Item>
                        {#if file.status === "UPLOADED"}
                          <DropdownMenu.Item onclick={() => handleProcessFile(file.id)}>
                            <PlayIcon class="size-4" />
                            Process
                          </DropdownMenu.Item>
                        {:else if file.status === "FAILED"}
                          <DropdownMenu.Item onclick={() => handleProcessFile(file.id)}>
                            <PlayIcon class="size-4" />
                            Retry
                          </DropdownMenu.Item>
                        {/if}
                        <DropdownMenu.Item onclick={() => handleDownloadFile(file.id)}>
                          <DownloadIcon class="size-4" />
                          Download
                        </DropdownMenu.Item>
                        {#if file.status === "UPLOADED" || file.status === "FAILED" || file.status === "REJECTED"}
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="text-destructive"
                            onclick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2Icon class="size-4" />
                            Delete
                          </DropdownMenu.Item>
                        {/if}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  {/if}
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>

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
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Upload Invoices</Dialog.Title>
      <Dialog.Description>Upload supplier invoices for OCR processing</Dialog.Description>
    </Dialog.Header>

    <div class="space-x-4">
      <FileDropZone.Root
        accept=".jpg,.jpeg,.png,.pdf"
        disabled={disabledFileDropZone}
        maxFileSize={10 * 1024 * 1024}
        maxFiles={10}
        onUpload={handleUpload}
        onFileRejected={({ reason, file }) => {
          disabledFileDropZone = false;
          toast.error(`${file.name}: ${reason}`);
        }}
      >
        <FileDropZone.Trigger />
      </FileDropZone.Root>

      {#if uploadProgress.total > 0}
        <div class="mb-3 space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <Loader2Icon class="size-4 animate-spin" />
            <span class="text-muted-foreground"
              >Uploading {uploadProgress.current} of {uploadProgress.total}...</span
            >
          </div>
          <Progress.Root value={uploadProgress.current} max={uploadProgress.total} />
        </div>
      {/if}

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
