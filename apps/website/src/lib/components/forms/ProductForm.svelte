<script lang="ts">
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import KeyboardIcon from "@lucide/svelte/icons/keyboard";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import ScanBarcodeIcon from "@lucide/svelte/icons/scan-barcode";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Html5Qrcode } from "html5-qrcode";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";
  import z from "zod";
  import { browser } from "$app/environment";

  import { orpc } from "$lib/orpc_client";

  interface Props {
    slug: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { slug, onSuccess, onCancel }: Props = $props();

  const queryClient = useQueryClient();

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

  const uploadImageMutation = createMutation(() =>
    orpc.images.uploadImage.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to upload image");
      },
    })
  );

  let barcodeMode = $state<"skip" | "manual" | "scan">("skip");
  let isScanning = $state(false);
  let scannerError = $state<string | null>(null);
  let html5QrCode: Html5Qrcode | null = null;
  const scannerContainerId = "product-barcode-scanner";

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

  let imagePreview = $state<string | null>(null);
  let isUploadingImage = $state(false);

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      const priceCents = Math.round(Number.parseFloat(value.price || "0") * 100);

      createProduct.mutate({
        slug,
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
    isUploadingImage = true;
    try {
      const result = await uploadImageMutation.mutateAsync({
        slug,
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

  export function resetForm() {
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
    stopScanner();
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

  <div class="flex justify-end gap-2">
    {#if onCancel}
      <Button type="button" variant="outline" onclick={onCancel}>
        Cancel
      </Button>
    {/if}
    <Button type="submit" disabled={createProduct.isPending || isUploadingImage}>
      {#if createProduct.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        Creating...
      {:else}
        Create Product
      {/if}
    </Button>
  </div>
</form>
