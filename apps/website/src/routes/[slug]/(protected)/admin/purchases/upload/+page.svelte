<script lang="ts">
  import ClockIcon from "@lucide/svelte/icons/clock";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ImageIcon from "@lucide/svelte/icons/image";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PlayIcon from "@lucide/svelte/icons/play";
  import ReviewIcon from "@lucide/svelte/icons/search";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Progress } from "@repo/ui/progress";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const queryClient = useQueryClient();

  let isDragging = $state(false);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let processingFileId = $state<string | null>(null);
  let processingProgress = $state(0);

  const invoiceFiles = createInfiniteQuery(() =>
    orpc.purchaseInvoices.listFiles.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allFiles = $derived(invoiceFiles.data?.pages.flatMap((page) => page.items) ?? []);

  const uploadMutation = createMutation(() =>
    orpc.purchaseInvoices.uploadFile.mutationOptions({
      onSuccess: () => {
        toast.success("File uploaded successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload file");
      },
    })
  );

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
    uploadProgress = 0;

    const progressInterval = setInterval(() => {
      if (uploadProgress < 90) {
        uploadProgress += 10;
      }
    }, 100);

    try {
      await uploadMutation.mutateAsync({ slug: params.slug, file });
      uploadProgress = 100;
    } finally {
      clearInterval(progressInterval);
      isUploading = false;
      uploadProgress = 0;
    }
  }

  async function handleProcessFile() {
    // TODO process file
  }

  // TODO create supplier and handle process is two step process
  // TODO don't use goto use anchor tag 
  function handleReviewFile(fileId: string) {
    goto(`/${shop.slug}/admin/purchases/review?fileId=${fileId}`);
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "UPLOADED":
        return "secondary";
      case "PROCESSING":
        return "default";
      case "PROCESSED":
        return "default";
      case "FAILED":
        return "destructive";
      case "REVIEWED":
        return "outline";
      default:
        return "secondary";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "UPLOADED":
        return "Uploaded";
      case "PROCESSING":
        return "Processing";
      case "PROCESSED":
        return "Ready to Review";
      case "FAILED":
        return "Failed";
      case "REVIEWED":
        return "Reviewed";
      default:
        return status;
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Upload Invoice" },
    ]}
  />

  <div>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Upload Invoice</h1>
      <p class="text-muted-foreground text-sm">Upload a supplier invoice for OCR processing</p>
    </div>
  </div>

  <Card.Root>
    <Card.Content class="p-8">
      <div
        class="rounded-lg border-2 border-dashed p-12 transition-all duration-200 {isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && document.getElementById("file-input")?.click()}
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
              <div class="w-full max-w-xs">
                <Progress value={uploadProgress} class="h-2" />
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
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              class="hidden"
              onchange={handleFileInput}
            />
            <Button onclick={() => document.getElementById("file-input")?.click()}>
              <UploadIcon class="mr-2 size-4" />
              Select File
            </Button>
          {/if}
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Tips for Best Results</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="flex items-start gap-3">
          <div class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <ImageIcon class="text-primary size-4" />
          </div>
          <div>
            <p class="text-sm font-medium">Clear Images</p>
            <p class="text-muted-foreground text-xs">Ensure the invoice is well-lit and in focus</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <ClockIcon class="text-primary size-4" />
          </div>
          <div>
            <p class="text-sm font-medium">Full Page</p>
            <p class="text-muted-foreground text-xs">
              Capture the entire invoice including header and totals
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <FileTextIcon class="text-primary size-4" />
          </div>
          <div>
            <p class="text-sm font-medium">Readable Text</p>
            <p class="text-muted-foreground text-xs">
              Make sure all text is clearly visible and not blurred
            </p>
          </div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <FileTextIcon class="size-5" />
        Uploaded Files
      </Card.Title>
      <Card.Description>Files waiting to be processed or reviewed</Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      {#if invoiceFiles.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if invoiceFiles.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">Failed to load files</p>
        </div>
      {:else if allFiles.length === 0}
        <div class="flex flex-col items-center justify-center gap-4 py-12">
          <div class="bg-muted flex size-12 items-center justify-center rounded-full">
            <FileTextIcon class="text-muted-foreground size-6" />
          </div>
          <div class="text-center">
            <p class="font-medium">No files uploaded yet</p>
            <p class="text-muted-foreground text-sm">Upload an invoice to get started</p>
          </div>
        </div>
      {:else}
        <ScrollArea class="max-h-96">
          <div class="divide-y">
            {#each allFiles as file (file.id)}
              <div class="flex items-center gap-4 p-4">
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
                  <p class="truncate font-medium">{file.filename}</p>
                  <div class="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{formatFileSize(file.size)}</span>
                    <span>·</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>

                <Badge variant={getStatusBadgeVariant(file.status)}>
                  {getStatusLabel(file.status)}
                </Badge>

                <div class="flex shrink-0 gap-2">
                  {#if processingFileId === file.id}
                    <div class="flex items-center gap-2">
                      <Progress value={processingProgress} class="h-2 w-20" />
                      <span class="text-muted-foreground text-xs">{processingProgress}%</span>
                    </div>
                  {:else if file.status === "UPLOADED"}
                    <Button variant="outline" size="sm" onclick={handleProcessFile}>
                      <PlayIcon class="mr-1 size-4" />
                      Process
                    </Button>
                  {:else if file.status === "PROCESSED"}
                    <Button variant="default" size="sm" onclick={() => handleReviewFile(file.id)}>
                      <ReviewIcon class="mr-1 size-4" />
                      Review
                    </Button>
                  {:else if file.status === "PROCESSING"}
                    <div class="text-muted-foreground flex items-center gap-2">
                      <Loader2Icon class="size-4 animate-spin" />
                      <span class="text-sm">Processing...</span>
                    </div>
                  {:else if file.status === "REVIEWED"}
                    <Button variant="outline" size="sm" disabled>
                      <ReviewIcon class="mr-1 size-4" />
                      Reviewed
                    </Button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </ScrollArea>

        {#if invoiceFiles.hasNextPage}
          <div class="flex justify-center border-t p-4">
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
    </Card.Content>
  </Card.Root>
</div>
