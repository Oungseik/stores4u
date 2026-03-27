<script lang="ts">
  import KeyboardIcon from "@lucide/svelte/icons/keyboard";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { TagsInput } from "@repo/ui/tags-input";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import BarcodeScanner from "$lib/components/scanner/BarcodeScanner.svelte";
  import { orpc } from "$lib/orpc_client";

  interface ProductInitialData {
    id: string;
    name: string;
    sku: string;
    priceCents: number;
    uom: string;
    description: string | null;
    image: string | null;
    barcode: string | null;
    categoryIds?: string[];
  }

  interface Props {
    slug: string;
    initialData?: ProductInitialData;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { slug, initialData, onSuccess, onCancel }: Props = $props();

  const queryClient = useQueryClient();

  const categoriesQuery = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { slug, pageSize: 1000 },
    })
  );

  const createProduct = createMutation(() =>
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        toast.success("Product created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create product");
      },
    })
  );

  const updateProduct = createMutation(() =>
    orpc.products.update.mutationOptions({
      onSuccess: () => {
        toast.success("Product updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update product");
      },
    })
  );

  const uploadMutation = createMutation(() =>
    orpc.images.upload.mutationOptions({
      onError: () => {
        toast.error("Failed to upload image");
      },
    })
  );

  let barcodeMode = $state<"skip" | "manual" | "scan">("skip");
  // svelte-ignore non_reactive_update
  let scannerRef: BarcodeScanner | null = null;

  // svelte-ignore state_referenced_locally
  const isEditMode = !!initialData;

  // svelte-ignore state_referenced_locally
  const categoryNames = $derived(
    initialData?.categoryIds
      ?.map((id) => categoriesQuery.data?.items.find((c) => c.id === id)?.name)
      .filter((name): name is string => name !== undefined) ?? []
  );

  // svelte-ignore state_referenced_locally
  const defaultValues = {
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    // svelte-ignore state_referenced_locally
    price: initialData ? (initialData.priceCents / 100).toFixed(2) : "",
    uom: initialData?.uom ?? "piece",
    description: initialData?.description ?? "",
    image: null as File | null,
    imageUrl: initialData?.image ?? "",
    barcode: initialData?.barcode ?? "",
    categoryNames,
  };

  // svelte-ignore state_referenced_locally
  let imagePreview = $state<string | null>(initialData?.image ?? null);
  let isUploadingImage = $state(false);

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      const priceCents = Math.round(Number.parseFloat(value.price || "0") * 100);

      const categoryIds = value.categoryNames
        .map((name) => categoriesQuery.data?.items.find((c) => c.name === name)?.id)
        .filter((id): id is string => id !== undefined);

      if (isEditMode) {
        updateProduct.mutate({
          slug,
          id: initialData.id,
          sku: value.sku,
          name: value.name,
          priceCents,
          uom: value.uom,
          description: value.description || null,
          image: value.imageUrl || null,
          barcode: value.barcode || null,
          categoryIds: categoryIds.length > 0 ? categoryIds : null,
        });
      } else {
        createProduct.mutate({
          slug,
          sku: value.sku,
          name: value.name,
          priceCents,
          uom: value.uom,
          description: value.description || undefined,
          image: value.imageUrl || undefined,
          barcode: value.barcode || undefined,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        });
      }
    },
  }));

  const categorySuggestions = $derived(categoriesQuery.data?.items.map((c) => c.name) ?? []);

  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
  type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

  function isValidImageType(type: string): type is AcceptedImageType {
    return ACCEPTED_IMAGE_TYPES.includes(type as AcceptedImageType);
  }

  async function handleImageUpload(file: File) {
    if (!isValidImageType(file.type)) {
      toast.error("Invalid image type");
      return;
    }

    isUploadingImage = true;
    try {
      const result = await uploadMutation.mutateAsync({ slug, file });
      form.setFieldValue("imageUrl", result.objectPath);
      imagePreview = result.objectPath;
    } catch {
      toast.error("Failed to upload image");
    } finally {
      isUploadingImage = false;
    }
  }

  function handleImageRemove() {
    form.setFieldValue("image", null);
    form.setFieldValue("imageUrl", "");
    imagePreview = null;
  }

  export function resetForm() {
    form.reset();
    barcodeMode = "skip";
    imagePreview = null;
    isUploadingImage = false;
    scannerRef?.stop();
  }

  function handleBarcodeModeChange(mode: "skip" | "manual" | "scan") {
    barcodeMode = mode;
    if (mode === "scan") {
      scannerRef?.start();
    } else {
      scannerRef?.stop();
    }
  }

  function handleScan(barcode: string) {
    form.setFieldValue("barcode", barcode);
    scannerRef?.stop();
    barcodeMode = "manual";
    toast.success("Barcode scanned successfully");
  }

  $effect(() => {
    scannerRef?.stop();
  });
</script>

<form
  class="space-y-4 py-4"
  onsubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }}
>
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

  <form.Field
    name="sku"
    validators={{
      onChange: ({ value }) =>
        z.string().min(1, "SKU is required").max(100).safeParse(value).error?.issues.at(0)?.message,
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

  <form.Field name="categoryNames">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label>Categories</Label>
        {#if categoriesQuery.isPending}
          <div class="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2Icon class="size-4 animate-spin" />
            Loading categories...
          </div>
        {:else}
          <TagsInput
            value={field.state.value}
            onValueChange={(value) => field.handleChange(value)}
            suggestions={categorySuggestions}
            restrictToSuggestions={true}
            placeholder="Select categories..."
          />
          <p class="text-muted-foreground text-xs">
            Type to search and select categories. Create categories first in the Categories page.
          </p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <div class="space-y-2">
    <Label>Product Image</Label>
    {#if imagePreview}
      <div class="relative">
        <img
          src={imagePreview}
          alt="Product preview"
          class="w-full rounded-lg border object-cover"
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

  <div class="space-y-3 rounded-lg border p-4">
    <div class="flex items-center gap-2">
      <QrCodeIcon class="text-muted-foreground size-4" />
      <Label class="font-medium">Barcode</Label>
    </div>

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

    {#if barcodeMode === "scan"}
      <div class="space-y-2">
        <BarcodeScanner
          bind:this={scannerRef}
          containerId="product-barcode-scanner"
          onScan={handleScan}
          class="bg-muted relative h-40 w-full overflow-hidden rounded-lg"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="w-full"
          onclick={() => handleBarcodeModeChange("manual")}
        >
          Cancel Scan
        </Button>
      </div>
    {/if}
  </div>

  <div class="flex justify-end gap-2">
    {#if onCancel}
      <Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
    {/if}
    <Button
      type="submit"
      disabled={createProduct.isPending || updateProduct.isPending || isUploadingImage}
    >
      {#if createProduct.isPending || updateProduct.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        {isEditMode ? "Updating..." : "Creating..."}
      {:else}
        {isEditMode ? "Update Product" : "Create Product"}
      {/if}
    </Button>
  </div>
</form>
