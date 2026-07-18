<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ImageIcon from "@lucide/svelte/icons/image";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import type { PurchaseInvoiceFileStatus } from "$lib/server/db";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FileDropZone from "@repo/ui/file-drop-zone";
  import * as FilterBar from "@repo/ui/filter-bar";
  import * as Progress from "@repo/ui/progress";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import StatusCell from "$lib/components/tables/purchase-invoice-files/cells/StatusCell.svelte";
  import { createColumns } from "$lib/components/tables/purchase-invoice-files/columns";
  import { orpc } from "$lib/orpc_client";
  import { type InvoiceFilesView, invoiceFilesFilterSchema } from "$lib/search_param";

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
    UPLOADED: msg.ui_uploaded(),
    PROCESSING: msg.ui_processing_e63451d(),
    PROCESSED: msg.ui_ready_to_review(),
    FAILED: msg.ui_failed(),
    REVIEWED: msg.ui_reviewed(),
    REJECTED: msg.ui_rejected(),
  };

  const statusOptions = $derived(
    statusKeys.map((key) => ({
      value: key satisfies string,
      label: statusLabels[key],
    })),
  );

  const invoiceFiles = createInfiniteQuery(() =>
    orpc.purchaseInvoices.listFiles.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        statuses: (() => {
          const s = JSON.parse(debouncedStatuses.current) as PurchaseInvoiceFileStatus[];
          return s.length > 0 ? s : undefined;
        })(),
        search: debouncedSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allFiles = $derived(invoiceFiles.data?.pages.flatMap((page) => page.items) ?? []);
  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.statuses.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", statuses: [] });
  }

  const processMutation = createMutation(() =>
    orpc.purchaseInvoices.processFile.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_invoice_processed_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        processingFileId = null;
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_process_invoice"));
        processingFileId = null;
      },
    }),
  );

  const uploadMutation = createMutation(() => orpc.purchaseInvoices.uploadFile.mutationOptions());

  const deleteMutation = createMutation(() =>
    orpc.purchaseInvoices.deleteFile.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_file_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_file"));
      },
    }),
  );

  function handleProcessFile(fileId: string) {
    processingFileId = fileId;
    processMutation.mutateAsync({ fileId });
  }

  async function handleUpload(files: File[]) {
    disabledFileDropZone = true;
    uploadProgress = { current: 0, total: files.length };

    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(
      files.map((file, i) =>
        uploadMutation
          .mutateAsync({ file })
          .then((result) => {
            uploadProgress = { current: i + 1, total: files.length };
            successCount++;
            return result;
          })
          .catch((error) => {
            uploadProgress = { current: i + 1, total: files.length };
            failCount++;
            toast.error(
              msg.file_error({
                file: file.name,
                error: localizeError(error, "ui_failed_to_upload"),
              }),
            );
            throw error;
          }),
      ),
    );

    if (successCount > 0) {
      toast.success(msg.files_uploaded({ count: successCount }));
      queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
    }

    uploadProgress = { current: 0, total: 0 };
    disabledFileDropZone = false;

    if (failCount === 0) {
      isUploadDialogOpen = false;
    }
  }

  function handleDeleteFile(id: string) {
    confirmDelete({
      title: msg.ui_delete_invoice_file(),
      description: msg.ui_are_you_sure_you_want_to_delete_this_invoice_file_this_(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ fileId: id });
      },
    });
  }

  const columns = $derived(createColumns(handleProcessFile, processingFileId, handleDeleteFile));

  function getFileTypeLabel(fileType: string): string {
    if (fileType === "application/pdf") return "PDF";
    if (fileType.startsWith("image/")) return msg.ui_image();
    return fileType;
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_invoice_files() }]}
  >
    {#snippet actions()}
      <div class="flex items-center justify-between gap-2">
        <Button onclick={() => (isUploadDialogOpen = true)}>
          <UploadIcon class="size-4" />
          {msg.ui_upload_invoice()}
        </Button>
      </div>
    {/snippet}
  </AdminDashboardHeader>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder={msg.ui_search_by_filename()}
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
        <FilterBar.CheckboxGroup
          items={statusOptions}
          value={searchParams.statuses}
          onValueChange={(value) =>
            searchParams.update({ statuses: value as PurchaseInvoiceFileStatus[] })}
          placeholder={msg.ui_all_statuses()}
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
        <ToggleGroupItem value="card" aria-label={msg.ui_card_view()}>
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label={msg.ui_table_view()}>
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
        <p class="text-red-500">{msg.ui_failed_to_load_invoice_files()}</p>
      </div>
    {:else if allFiles.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <FileTextIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_invoice_files_found()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? msg.ui_try_clearing_filters()
            : msg.ui_upload_your_first_invoice_to_get_started()}
        </p>
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
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
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
                  href={localizePath(
                    `/purchases/invoices/${file.id}${file.status === "REJECTED" ? "/review" : ""}`,
                  )}
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
                      <span class="hidden text-sm sm:inline">{msg.ui_processing()}</span>
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
                              href={localizePath(
                                `/purchases/invoices/${file.id}${file.status === "REJECTED" ? "/review" : ""}`,
                              )}
                              class={buttonVariants({
                                variant: "ghost",
                                class: "w-full justify-start px-2!",
                              })}
                            >
                              <SearchIcon class="text-muted-foreground size-4" />
                              <span
                                >{file.status === "REVIEWED" || file.status === "REJECTED"
                                  ? msg.ui_view_details()
                                  : msg.ui_review()}</span
                              >
                            </a>
                          {/snippet}
                        </DropdownMenu.Item>
                        {#if file.status === "REVIEWED"}
                          <DropdownMenu.Item>
                            {#snippet child()}
                              <a
                                href={localizePath(`/purchases/invoices/${file.id}/edit`)}
                                class={buttonVariants({
                                  variant: "ghost",
                                  class: "w-full justify-start",
                                })}
                              >
                                <PencilIcon class="text-muted-foreground size-4" />
                                <span>{msg.ui_edit()}</span>
                              </a>
                            {/snippet}
                          </DropdownMenu.Item>
                        {/if}
                        {#if file.status === "UPLOADED"}
                          <DropdownMenu.Item onclick={() => handleProcessFile(file.id)}>
                            <PlayIcon class="size-4" />
                            {msg.ui_process()}
                          </DropdownMenu.Item>
                        {:else if file.status === "FAILED"}
                          <DropdownMenu.Item onclick={() => handleProcessFile(file.id)}>
                            <PlayIcon class="size-4" />
                            {msg.ui_retry()}
                          </DropdownMenu.Item>
                        {/if}
                        {#if file.status === "UPLOADED" || file.status === "FAILED" || file.status === "REJECTED"}
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="text-destructive"
                            onclick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2Icon class="size-4" />
                            {msg.ui_delete()}
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
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
            {/if}
          </Button>
        </div>
      {/if}
    {/if}
  </section>
</div>

<Dialog.Root bind:open={isUploadDialogOpen}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>{msg.ui_upload_invoices()}</Dialog.Title>
      <Dialog.Description>{msg.ui_upload_supplier_invoices_for_ocr_processing()}</Dialog.Description
      >
    </Dialog.Header>

    <div class="space-x-4 px-3 sm:px-4">
      <FileDropZone.Root
        accept=".jpg,.jpeg,.png,.pdf"
        disabled={disabledFileDropZone}
        maxFileSize={10 * 1024 * 1024}
        maxFiles={10}
        onUpload={handleUpload}
        onFileRejected={({ reason, file }) => {
          disabledFileDropZone = false;
          toast.error(msg.file_error({ file: file.name, error: reason }));
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
        <Card.Header>
          <Card.Title class="text-base">{msg.ui_tips_for_best_results()}</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="text-muted-foreground list-disc space-y-1.5 pl-4 text-sm">
            <li>{msg.ui_ensure_the_invoice_is_well_lit_and_in_focus()}</li>
            <li>{msg.ui_capture_the_entire_invoice_including_header_and_totals()}</li>
            <li>{msg.ui_make_sure_all_text_is_clearly_visible_and_not_blurred()}</li>
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>
