<script lang="ts">
  // import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  // import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
  import KeyboardIcon from "@lucide/svelte/icons/keyboard";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  // import * as FileDropZone from "@repo/ui/file-drop-zone";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
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
    images?: string[];
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

  // const uploadMutation = createMutation(() =>
  //   orpc.images.upload.mutationOptions({
  //     onError: () => {
  //       toast.error("Failed to upload image");
  //     },
  //   })
  // );
  //
  // const deleteImageMutation = createMutation(() =>
  //   orpc.images.delete.mutationOptions({
  //     onError: (error) => {
  //       toast.error(error.message || "Failed to delete image");
  //     },
  //   })
  // );

  let barcodeMode = $state<"skip" | "manual" | "scan">("skip");
  // svelte-ignore non_reactive_update
  let scannerRef: BarcodeScanner | null = null;

  // svelte-ignore state_referenced_locally
  const isEditMode = !!initialData;

  const categoryNames = $derived(
    initialData?.categoryIds
      ?.map((id) => categoriesQuery.data?.items.find((c) => c.id === id)?.name)
      .filter((name): name is string => name !== undefined) ?? []
  );

  // svelte-ignore state_referenced_locally
  const initialImages = initialData?.images ?? (initialData?.image ? [initialData.image] : []);

  let nextImageId = 0;
  const initialImageEntries = initialImages.map((url) => ({ id: nextImageId++, url }));

  // svelte-ignore state_referenced_locally
  const defaultValues = {
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    price: initialData ? initialData.priceCents / 100 : 0,
    uom: initialData?.uom ?? "piece",
    description: initialData?.description ?? "",
    barcode: initialData?.barcode ?? "",
    categoryNames,
  };

  let imageEntries = $state<{ id: number; url: string }[]>([...initialImageEntries]);
  let deletingImageIds = $state<Set<number>>(new Set());
  let isUploadingImage = $state(false);

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      const priceCents = Math.round((value.price || 0) * 100);

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
          image: imageEntries[0]?.url ?? null,
          images: imageEntries.length > 0 ? imageEntries.map((e) => e.url) : null,
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
          image: imageEntries[0]?.url ?? undefined,
          images: imageEntries.length > 0 ? imageEntries.map((e) => e.url) : undefined,
          barcode: value.barcode || undefined,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        });
      }
    },
  }));

  const categorySuggestions = $derived(categoriesQuery.data?.items.map((c) => c.name) ?? []);

  // const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
  // type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

  // function isValidImageType(type: string): type is AcceptedImageType {
  //   return ACCEPTED_IMAGE_TYPES.includes(type as AcceptedImageType);
  // }

  // async function handleImageUpload(files: File[]) {
  //   const validFiles = files.filter((f) => {
  //     if (!isValidImageType(f.type)) {
  //       toast.error(`Invalid image type: ${f.name}`);
  //       return false;
  //     }
  //     return true;
  //   });
  //
  //   if (validFiles.length === 0) return;
  //
  //   isUploadingImage = true;
  //   try {
  //     const results = await Promise.all(
  //       validFiles.map((file) => uploadMutation.mutateAsync({ slug, file }))
  //     );
  //     imageEntries = [
  //       ...imageEntries,
  //       ...results.map((r) => ({ id: nextImageId++, url: r.objectPath })),
  //     ];
  //   } catch {
  //     toast.error("Failed to upload one or more images");
  //   } finally {
  //     isUploadingImage = false;
  //   }
  // }
  //
  // async function handleImageRemove(id: number) {
  //   const entry = imageEntries.find((e) => e.id === id);
  //   if (!entry) return;
  //
  //   deletingImageIds = new Set([...deletingImageIds, id]);
  //   try {
  //     await deleteImageMutation.mutateAsync({ slug, objectPath: entry.url });
  //   } catch {
  //     // storage cleanup failed, still remove from local state
  //   }
  //   deletingImageIds = new Set([...deletingImageIds].filter((i) => i !== id));
  //   imageEntries = imageEntries.filter((e) => e.id !== id);
  // }
  //
  // function handleImageMove(id: number, direction: "up" | "down") {
  //   const index = imageEntries.findIndex((entry) => entry.id === id);
  //   if (index === -1) return;
  //   const newIndex = direction === "up" ? index - 1 : index + 1;
  //   if (newIndex < 0 || newIndex >= imageEntries.length) return;
  //   const updated = [...imageEntries];
  //   const temp = updated[index];
  //   updated[index] = updated[newIndex];
  //   updated[newIndex] = temp;
  //   imageEntries = updated;
  // }

  export function resetForm() {
    form.reset();
    barcodeMode = "skip";
    imageEntries = [...initialImageEntries];
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
          if (!value || value <= 0) return "Price must be greater than 0";
          return undefined;
        },
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Retail Price ($) *</Label>
          <NumberInput
            value={field.state.value}
            onValueChange={(v) => field.handleChange(v)}
            onblur={field.handleBlur}
            fraction={2}
            min={0.01}
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
      </div>
    {/snippet}
  </form.Field>

  <!-- <div class="space-y-2">
    <Label>Product Images</Label>

    <FileDropZone.Root
      accept="image/jpeg,image/png,image/webp,image/svg+xml"
      maxFileSize={2 * 1024 * 1024}
      disabled={isUploadingImage}
      fileCount={imageEntries.length}
      onUpload={handleImageUpload}
      onFileRejected={({ reason, file }) => toast.error(`${file.name}: ${reason}`)}
    >
      <FileDropZone.Trigger />
    </FileDropZone.Root>
    <p class="text-muted-foreground text-xs">
      First image is the primary image. Select multiple images to upload at once.
    </p>

    {#if imageEntries.length > 0}
      <div class="space-y-2">
        {#each imageEntries as entry, i (entry.id)}
          <div class="bg-muted/50 group relative flex items-center gap-3 rounded-lg border p-2">
            {#if i === 0}
              <span
                class="bg-primary text-primary-foreground ml-1 flex size-5 shrink-0 items-center justify-center rounded text-xs font-medium"
              >
                {i + 1}
              </span>
            {:else}
              <span
                class="text-muted-foreground ml-1 flex size-5 shrink-0 items-center justify-center rounded text-xs font-medium"
              >
                {i + 1}
              </span>
            {/if}
            <img
              src={entry.url}
              alt="Product image {i + 1}"
              class="size-16 shrink-0 rounded-md object-cover"
            />
            <div class="min-w-0 flex-1">
              <p class="text-muted-foreground truncate text-xs">
                Image {i + 1}{i === 0 ? " (primary)" : ""}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-7"
                disabled={i === 0}
                onclick={() => handleImageMove(entry.id, "up")}
              >
                <ChevronUpIcon class="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-7"
                disabled={i === imageEntries.length - 1}
                onclick={() => handleImageMove(entry.id, "down")}
              >
                <ChevronDownIcon class="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive size-7"
                disabled={deletingImageIds.has(entry.id)}
                onclick={() => handleImageRemove(entry.id)}
              >
                {#if deletingImageIds.has(entry.id)}
                  <Loader2Icon class="size-4 animate-spin" />
                {:else}
                  <XIcon class="size-4" />
                {/if}
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div> -->

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
      disabled={createProduct.isPending ||
        updateProduct.isPending ||
        isUploadingImage ||
        deletingImageIds.size > 0}
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
