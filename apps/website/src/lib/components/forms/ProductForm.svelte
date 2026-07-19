<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import KeyboardIcon from "@lucide/svelte/icons/keyboard";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
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
    lowStockThreshold: number | null;
  }

  interface Props {
    initialData?: ProductInitialData;
    onSuccess?: () => void;
  }

  let { initialData, onSuccess }: Props = $props();

  const queryClient = useQueryClient();

  const categoriesQuery = createQuery(() =>
    orpc.categories.list.queryOptions({
      input: { pageSize: 100 },
    }),
  );

  const createProduct = createMutation(() =>
    orpc.products.create.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_product_created_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_create_product"));
      },
    }),
  );

  const updateProduct = createMutation(() =>
    orpc.products.update.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_product_updated_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_update_product"));
      },
    }),
  );

  let barcodeMode = $state<"skip" | "manual" | "scan">("skip");
  // svelte-ignore non_reactive_update
  let scannerRef: BarcodeScanner | null = null;

  // svelte-ignore state_referenced_locally
  const isEditMode = !!initialData;

  const categoryNames = $derived(
    initialData?.categoryIds
      ?.map((id) => categoriesQuery.data?.items.find((c) => c.id === id)?.name)
      .filter((name): name is string => name !== undefined) ?? [],
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
    lowStockThreshold: initialData?.lowStockThreshold ?? 10,
    categoryNames,
  };

  let imageEntries = $state<{ id: number; url: string }[]>([...initialImageEntries]);

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      const priceCents = Math.round((value.price || 0) * 100);

      const categoryIds = value.categoryNames
        .map((name) => categoriesQuery.data?.items.find((c) => c.name === name)?.id)
        .filter((id): id is string => id !== undefined);

      if (isEditMode) {
        updateProduct.mutate({
          id: initialData.id,
          sku: value.sku,
          name: value.name,
          priceCents,
          uom: value.uom,
          description: value.description || null,
          image: imageEntries[0]?.url ?? null,
          images: imageEntries.length > 0 ? imageEntries.map((e) => e.url) : null,
          barcode: value.barcode || null,
          lowStockThreshold: value.lowStockThreshold,
          categoryIds: categoryIds.length > 0 ? categoryIds : null,
        });
      } else {
        createProduct.mutate({
          sku: value.sku,
          name: value.name,
          priceCents,
          uom: value.uom,
          description: value.description || undefined,
          image: imageEntries[0]?.url ?? undefined,
          images: imageEntries.length > 0 ? imageEntries.map((e) => e.url) : undefined,
          barcode: value.barcode || undefined,
          lowStockThreshold: value.lowStockThreshold,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        });
      }
    },
  }));

  const categorySuggestions = $derived(categoriesQuery.data?.items.map((c) => c.name) ?? []);

  export function resetForm() {
    form.reset();
    barcodeMode = "skip";
    imageEntries = [...initialImageEntries];
    scannerRef?.stop();
  }

  export function submit() {
    form.handleSubmit();
  }

  export function getIsPending() {
    return createProduct.isPending || updateProduct.isPending;
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
    toast.success(msg.ui_barcode_scanned_successfully());
  }

  $effect(() => {
    scannerRef?.stop();
  });
</script>

<form
  class="space-y-4 px-1 py-4"
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
        z.string().min(1, msg.ui_name_is_required()).max(255).safeParse(value).error?.issues.at(0)
          ?.message,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_name_d145bb8()}</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder={msg.ui_product_name()}
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
        z.string().min(1, msg.ui_sku_is_required()).max(100).safeParse(value).error?.issues.at(0)
          ?.message,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_sku_aef8aad()}</Label>
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
          if (!value || value <= 0) return msg.ui_price_must_be_greater_than_0();
          return undefined;
        },
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>{msg.ui_retail_price()}</Label>
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
          z.string().min(1, msg.ui_uom_is_required()).max(50).safeParse(value).error?.issues.at(0)
            ?.message,
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>{msg.ui_uom()}</Label>
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

  <form.Field
    name="lowStockThreshold"
    validators={{
      onChange: ({ value }) => {
        if (value == null) return undefined;
        const parsed = z.number().int().min(0).safeParse(value);
        return parsed.error?.issues.at(0)?.message;
      },
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_low_stock_threshold()}</Label>
        <NumberInput
          value={field.state.value}
          onValueChange={(v) => field.handleChange(v)}
          onblur={field.handleBlur}
          fraction={0}
          min={0}
          placeholder="10"
        />
        <p class="text-muted-foreground text-xs">
          {msg.ui_alert_when_stock_falls_below_this_number()}
        </p>
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="description">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_description()}</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder={msg.ui_product_description_optional()}
          rows={3}
        />
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="categoryNames">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label>{msg.ui_categories()}</Label>
        <TagsInput
          value={field.state.value}
          onValueChange={(value) => field.handleChange(value)}
          suggestions={categorySuggestions}
          restrictToSuggestions={true}
          placeholder={msg.ui_select_categories()}
        />
        <p class="text-muted-foreground text-xs">
          {msg.ui_type_to_search_and_select_categories_create_categories_()}
        </p>
      </div>
    {/snippet}
  </form.Field>

  <!-- <div class="space-y-2">
    <Label>{msg.ui_product_images()}</Label>

    <FileDropZone.Root
      accept="image/jpeg,image/png,image/webp"
      maxFileSize={2 * 1024 * 1024}
      disabled={isUploadingImage}
      fileCount={imageEntries.length}
      onUpload={handleImageUpload}
      onFileRejected={({ reason, file }) => toast.error(msg.file_error({ file: file.name, error: reason }))}
    >
      <FileDropZone.Trigger />
    </FileDropZone.Root>
    <p class="text-muted-foreground text-xs">
      {msg.ui_first_image_is_the_primary_image_select_multiple_images()}
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
              alt={msg.ui_product_image_i_1({ index: i + 1 })}
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
      <Label class="font-medium">{msg.ui_barcode()}</Label>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={barcodeMode === "skip" ? "default" : "outline"}
        size="sm"
        onclick={() => handleBarcodeModeChange("skip")}
      >
        <XIcon class="mr-1 size-3" />
        {msg.ui_skip()}
      </Button>
      <Button
        type="button"
        variant={barcodeMode === "manual" ? "default" : "outline"}
        size="sm"
        onclick={() => handleBarcodeModeChange("manual")}
      >
        <KeyboardIcon class="mr-1 size-3" />
        {msg.ui_manual()}
      </Button>
      <Button
        type="button"
        variant={barcodeMode === "scan" ? "default" : "outline"}
        size="sm"
        onclick={() => handleBarcodeModeChange("scan")}
      >
        <ScanBarcodeIcon class="mr-1 size-3" />
        {msg.ui_scan()}
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
              placeholder={msg.ui_enter_barcode()}
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
          {msg.ui_cancel_scan()}
        </Button>
      </div>
    {/if}
  </div>
</form>
