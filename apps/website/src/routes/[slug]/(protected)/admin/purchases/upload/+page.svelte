<script lang="ts">
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ImageIcon from "@lucide/svelte/icons/image";
  import ScanLineIcon from "@lucide/svelte/icons/scan-line";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Progress } from "@repo/ui/progress";

  import { goto } from "$app/navigation";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // State
  let isDragging = $state(false);
  let uploadedFile: File | null = $state(null);
  let filePreview: string | null = $state(null);
  let ocrProgress = $state(0);
  let ocrStatus = $state<
    "idle" | "uploading" | "scanning" | "extracting" | "analyzing" | "complete" | "error"
  >("idle");
  let ocrMessage = $state("");
  let errorMessage = $state("");

  // OCR Steps
  const ocrSteps = [
    { status: "uploading" as const, message: "Uploading document...", progress: 30 },
    { status: "scanning" as const, message: "Scanning document layout...", progress: 70 },
    { status: "extracting" as const, message: "Extracting text and data...", progress: 90 },
    { status: "analyzing" as const, message: "Analyzing invoice structure...", progress: 100 },
  ];

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
      handleFile(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFile(input.files[0]);
    }
  }

  function handleFile(file: File) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      errorMessage = "Please upload a valid image (JPG, PNG) or PDF file";
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errorMessage = "File size must be less than 10MB";
      return;
    }

    uploadedFile = file;
    errorMessage = "";

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    // Start OCR simulation
    startOcrSimulation();
  }

  function startOcrSimulation() {
    ocrStatus = "uploading";
    ocrProgress = 0;
    ocrMessage = "Uploading document...";

    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < ocrSteps.length) {
        const step = ocrSteps[stepIndex];
        ocrStatus = step.status;
        ocrMessage = step.message;

        // Animate progress
        const targetProgress = step.progress;
        const progressInterval = setInterval(() => {
          if (ocrProgress < targetProgress) {
            ocrProgress += 1;
          } else {
            clearInterval(progressInterval);
          }
        }, 30);

        stepIndex++;
      } else {
        clearInterval(interval);
        ocrStatus = "complete";
        ocrMessage = "Processing complete!";
        ocrProgress = 100;
      }
    }, 1200);
  }

  function resetUpload() {
    uploadedFile = null;
    filePreview = null;
    ocrStatus = "idle";
    ocrProgress = 0;
    ocrMessage = "";
    errorMessage = "";
  }

  function proceedToReview() {
    goto(`/${shop.slug}/admin/purchases/review`);
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

  <!-- Page Title -->
  <div>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Upload Invoice</h1>
      <p class="text-muted-foreground text-sm">Upload a supplier invoice for OCR processing</p>
    </div>
  </div>

  {#if ocrStatus === "idle" || ocrStatus === "error"}
    <!-- Upload Zone -->
    <Card.Root>
      <Card.Content class="p-8">
        <div
          class="rounded-lg border-2 border-dashed p-12 transition-all duration-200 {isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'} {errorMessage ? 'border-red-500 bg-red-50' : ''}"
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === "Enter" && document.getElementById("file-input")?.click()}
        >
          <div class="flex flex-col items-center justify-center gap-4 text-center">
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
          </div>
        </div>

        {#if errorMessage}
          <div class="mt-4 flex items-center gap-2 text-sm text-red-600">
            <XIcon class="size-4" />
            {errorMessage}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Instructions -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Tips for Best Results</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex items-start gap-3">
            <div
              class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <ImageIcon class="text-primary size-4" />
            </div>
            <div>
              <p class="text-sm font-medium">Clear Images</p>
              <p class="text-muted-foreground text-xs">
                Ensure the invoice is well-lit and in focus
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div
              class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <ScanLineIcon class="text-primary size-4" />
            </div>
            <div>
              <p class="text-sm font-medium">Full Page</p>
              <p class="text-muted-foreground text-xs">
                Capture the entire invoice including header and totals
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div
              class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full"
            >
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
  {:else}
    <!-- OCR Processing -->
    <Card.Root>
      <Card.Content class="p-8">
        <div class="flex flex-col items-center justify-center gap-6 text-center">
          <div>
            <p class="text-lg font-semibold">
              {ocrStatus === "complete" ? "Processing Complete!" : "Processing Invoice..."}
            </p>
            <p class="text-muted-foreground mt-1 text-sm">{ocrMessage}</p>
          </div>

          <!-- Progress Bar -->
          <div class="w-full max-w-md">
            <Progress value={ocrProgress} class="h-2" />
            <div class="text-muted-foreground mt-2 flex justify-between text-xs">
              <span>Upload</span>
              <span>Scan</span>
              <span>Extract</span>
              <span>Analyze</span>
            </div>
          </div>

          <!-- File Preview -->
          {#if filePreview}
            <div class="mt-4 max-w-xs overflow-hidden rounded-lg border">
              <img src={filePreview} alt="Invoice preview" class="size-full object-cover" />
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-3">
            {#if ocrStatus === "complete"}
              <Button variant="outline" onclick={resetUpload}>
                <XIcon class="size-4" />
                Cancel
              </Button>
              <Button onclick={proceedToReview}>
                Continue to Review
                <ArrowRightIcon class="size-4" />
              </Button>
            {:else}
              <Button variant="outline" onclick={resetUpload}>
                <XIcon class="size-4" />
                Cancel
              </Button>
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
