<script lang="ts">
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import KeyboardIcon from "@lucide/svelte/icons/keyboard";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Html5Qrcode } from "html5-qrcode";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { browser } from "$app/environment";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();
  const queryClient = useQueryClient();

  const products = createInfiniteQuery(() =>
    orpc.products.list.infiniteOptions({
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

  const createProduct = createMutation(() =>
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        toast.success("Product created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        isDialogOpen = false;
        resetForm();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create product");
      },
    })
  );

  const uploadImageMutation = createMutation(() =>
    orpc.images.uploadImage.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to upload image");
      },
    })
  );

  function formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)}`;
  }

  const allProducts = $derived(products.data?.pages.flatMap((page) => page.items) ?? []);

  // Dialog state
  let isDialogOpen = $state(false);

  // Barcode mode: "skip" | "manual" | "scan"
  let barcodeMode = $state<"skip" | "manual" | "scan">("skip");

  // Scanner state
  let isScanning = $state(false);
  let scannerError = $state<string | null>(null);
  let html5QrCode: Html5Qrcode | null = null;
  const scannerContainerId = "product-barcode-scanner";

  // Form default values
  const defaultValues = {
    name: "",
    sku: "",
    price: "",
    uom: "piece",
    description: "",
    image: null as File | null,
    imageUrl: "",
    barcode: "",
  };

  // Image upload state
  let imagePreview = $state<string | null>(null);
  let isUploadingImage = $state(false);

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!params.slug) return;

      const priceCents = Math.round(Number.parseFloat(value.price || "0") * 100);

      createProduct.mutate({
        slug: params.slug,
        sku: value.sku,
        name: value.name,
        priceCents,
        uom: value.uom,
        description: value.description || undefined,
        image: value.imageUrl || undefined,
        barcode: value.barcode || undefined,
      });
    },
  }));

  async function handleImageUpload(file: File) {
    if (!params.slug) return;

    isUploadingImage = true;
    try {
      const result = await uploadImageMutation.mutateAsync({
        slug: params.slug,
        file,
      });
      form.setFieldValue("imageUrl", result.objectPath);
      imagePreview = result.objectPath;
    } finally {
      isUploadingImage = false;
    }
  }

  function handleImageRemove() {
    form.setFieldValue("image", null);
    form.setFieldValue("imageUrl", "");
    imagePreview = null;
  }

  function resetForm() {
    form.reset();
    barcodeMode = "skip";
    imagePreview = null;
    isUploadingImage = false;
    stopScanner();
  }

  async function startScanner() {
    try {
      await tick();
      const element = document.getElementById(scannerContainerId);
      if (!element) {
        console.error("Scanner container not found");
        return;
      }

      html5QrCode = new Html5Qrcode(scannerContainerId);
      isScanning = true;
      scannerError = null;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          form.setFieldValue("barcode", decodedText);
          stopScanner();
          barcodeMode = "manual";
          toast.success("Barcode scanned successfully");
        },
        () => {}
      );
    } catch (err) {
      isScanning = false;
      scannerError = "Camera access denied or not available";
      console.error("Scanner error:", err);
    }
  }

  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
        html5QrCode = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    isScanning = false;
  }

  function handleBarcodeModeChange(mode: "skip" | "manual" | "scan") {
    barcodeMode = mode;
    if (mode === "scan") {
      if (browser) {
        startScanner();
      }
    } else {
      stopScanner();
    }
  }

  $effect(() => {
    if (!isDialogOpen) {
      stopScanner();
    }
  });
</script>

<section class="overflow-y-auto p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold">Products</h2>
    <Dialog.Root bind:open={isDialogOpen}>
      <Dialog.Trigger class={["data-[state=open]:hidden", buttonVariants({ size: "sm" })]}>
        <PlusIcon class="mr-1 size-4" />
        Add Product
      </Dialog.Trigger>
      <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <Dialog.Header>
          <Dialog.Title>Add New Product</Dialog.Title>
          <Dialog.Description>Create a new product for your shop.</Dialog.Description>
        </Dialog.Header>
        <form
          class="space-y-4 py-4"
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <!-- Name -->
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                z.string().min(1, "Name is required").max(255).safeParse(value).error?.issues.at(0)
                  ?.message,
            }}
          >
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="text"
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="Product name"
                />
                {#if field.state.meta.errors.length}
                  <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                {/if}
              </div>
            {/snippet}
          </form.Field>

          <!-- SKU -->
          <form.Field
            name="sku"
            validators={{
              onChange: ({ value }) =>
                z.string().min(1, "SKU is required").max(100).safeParse(value).error?.issues.at(0)
                  ?.message,
            }}
          >
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>SKU *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="text"
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="e.g., PROD-001"
                />
                {#if field.state.meta.errors.length}
                  <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                {/if}
              </div>
            {/snippet}
          </form.Field>

          <!-- Price and UOM -->
          <div class="grid grid-cols-2 gap-4">
            <form.Field
              name="price"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Price is required";
                  const num = parseFloat(value);
                  if (isNaN(num) || num <= 0) return "Price must be greater than 0";
                  return undefined;
                },
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>Price ($) *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="number"
                    step="0.01"
                    min="0.01"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="0.00"
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>

            <form.Field
              name="uom"
              validators={{
                onChange: ({ value }) =>
                  z.string().min(1, "UOM is required").max(50).safeParse(value).error?.issues.at(0)
                    ?.message,
              }}
            >
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>UOM *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="text"
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="e.g., piece, kg, box"
                  />
                  {#if field.state.meta.errors.length}
                    <p class="text-sm text-red-500">{field.state.meta.errors}</p>
                  {/if}
                </div>
              {/snippet}
            </form.Field>
          </div>

          <!-- Description -->
          <form.Field name="description">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="Product description (optional)"
                  rows={3}
                />
              </div>
            {/snippet}
          </form.Field>

          <!-- Image Upload -->
          <div class="space-y-2">
            <Label>Product Image</Label>
            {#if imagePreview}
              <div class="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  class="h-40 w-full rounded-lg border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  class="absolute top-2 right-2"
                  onclick={handleImageRemove}
                >
                  <XIcon class="size-4" />
                </Button>
              </div>
            {:else}
              <div class="relative">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onchange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                      form.setFieldValue("image", file);
                      handleImageUpload(file);
                    }
                  }}
                  disabled={isUploadingImage}
                />
                {#if isUploadingImage}
                  <div class="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2Icon class="size-5 animate-spin" />
                  </div>
                {/if}
              </div>
              <p class="text-muted-foreground text-xs">
                Max file size: 2MB. Accepted formats: JPEG, PNG, WebP, SVG
              </p>
            {/if}
          </div>

          <!-- Barcode Section -->
          <div class="space-y-3 rounded-lg border p-4">
            <div class="flex items-center gap-2">
              <QrCodeIcon class="text-muted-foreground size-4" />
              <Label class="font-medium">Barcode</Label>
            </div>

            <!-- Barcode Mode Selection -->
            <div class="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={barcodeMode === "skip" ? "default" : "outline"}
                size="sm"
                onclick={() => handleBarcodeModeChange("skip")}
              >
                <XIcon class="mr-1 size-3" />
                Skip
              </Button>
              <Button
                type="button"
                variant={barcodeMode === "manual" ? "default" : "outline"}
                size="sm"
                onclick={() => handleBarcodeModeChange("manual")}
              >
                <KeyboardIcon class="mr-1 size-3" />
                Manual
              </Button>
              <Button
                type="button"
                variant={barcodeMode === "scan" ? "default" : "outline"}
                size="sm"
                onclick={() => handleBarcodeModeChange("scan")}
              >
                <ScanBarcodeIcon class="mr-1 size-3" />
                Scan
              </Button>
            </div>

            <!-- Manual Barcode Input -->
            {#if barcodeMode === "manual"}
              <form.Field name="barcode">
                {#snippet children(field)}
                  <div class="space-y-2">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type="text"
                      onblur={field.handleBlur}
                      onchange={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="Enter barcode"
                    />
                  </div>
                {/snippet}
              </form.Field>
            {/if}

            <!-- Scanner -->
            {#if barcodeMode === "scan"}
              <div class="space-y-2">
                <div
                  id={scannerContainerId}
                  class="bg-muted relative h-40 w-full overflow-hidden rounded-lg"
                >
                  {#if !isScanning && scannerError}
                    <div
                      class="flex h-full flex-col items-center justify-center gap-2 p-4 text-center"
                    >
                      <CameraOffIcon class="text-muted-foreground size-6" />
                      <p class="text-muted-foreground text-xs">{scannerError}</p>
                      <Button type="button" variant="outline" size="sm" onclick={startScanner}>
                        Try Again
                      </Button>
                    </div>
                  {:else if !isScanning}
                    <div class="flex h-full flex-col items-center justify-center gap-2">
                      <Loader2Icon class="size-5 animate-spin" />
                      <p class="text-muted-foreground text-xs">Starting camera...</p>
                    </div>
                  {/if}
                </div>
                {#if isScanning}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="w-full"
                    onclick={() => handleBarcodeModeChange("manual")}
                  >
                    Cancel Scan
                  </Button>
                {/if}
              </div>
            {/if}
          </div>

          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onclick={() => {
                isDialogOpen = false;
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending || isUploadingImage}>
              {#if createProduct.isPending}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                Creating...
              {:else}
                Create Product
              {/if}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  </div>

  {#if products.isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if products.isError}
    <div class="flex items-center justify-center py-12">
      <p class="text-red-500">Failed to load products</p>
    </div>
  {:else if allProducts.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
        <PackageIcon class="text-muted-foreground size-6" />
      </div>
      <p class="text-muted-foreground">No products found</p>
    </div>
  {:else}
    <div class="space-y-1.5">
      {#each allProducts as product (product.id)}
        <Card.Root class="overflow-hidden p-0">
          <Card.Content class="p-0">
            <button
              type="button"
              class="hover:bg-muted/50 justi flex w-full items-center gap-2.5 px-3 py-2 text-left"
            >
              <div class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                <PackageIcon class="text-muted-foreground size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div>
                  <p class="truncate text-sm font-medium">{product.name}</p>

                  <div class="text-muted-foreground text-xs">
                    {product.sku}{product.categories?.length > 0
                      ? ` • ${product.categories[0]}`
                      : ""}
                  </div>
                </div>
              </div>

              <span class="text-muted-foreground text-xs">{product.inStock} left</span>

              <p class="text-sm font-semibold">{formatPrice(product.priceCents)}</p>
              <ChevronRightIcon class="text-muted-foreground size-4 shrink-0" />
            </button>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    {#if products.hasNextPage}
      <div class="mt-4 flex justify-center">
        <Button
          variant="outline"
          onclick={() => products.fetchNextPage()}
          disabled={products.isFetchingNextPage}
        >
          {#if products.isFetchingNextPage}
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
