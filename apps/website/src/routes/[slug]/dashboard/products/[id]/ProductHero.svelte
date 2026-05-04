<script lang="ts">
  import BarcodeIcon from "@lucide/svelte/icons/barcode";
  import { type CountryCode } from "@repo/config";
  import { Badge } from "@repo/ui/badge";

  import ProductImageGallery from "$lib/components/ProductImageGallery.svelte";
  import { formatDate, formatPrice } from "$lib/utils";

  interface Props {
    product: {
      name: string;
      priceCents: number;
      stock: number;
      lowStockThreshold: number | null;
      sku: string;
      barcode: string | null;
      uom: string;
      description: string | null;
      image: string | null;
      categories: Array<{ id: string; name: string }>;
      createdAt: Date;
      updatedAt: Date;
    };
    hasLowStock: boolean;
    isOutOfStock: boolean;
    country?: CountryCode | null;
  }

  let { product, hasLowStock, isOutOfStock, country = null }: Props = $props();

  function formatUom(uom: string): string {
    const map: Record<string, string> = {
      each: "Each",
      kg: "Kilogram",
      g: "Gram",
      lb: "Pound",
      oz: "Ounce",
      l: "Liter",
      ml: "Milliliter",
      m: "Meter",
      cm: "Centimeter",
      ft: "Foot",
      in: "Inch",
      pack: "Pack",
      box: "Box",
      case: "Case",
      dozen: "Dozen",
    };
    return map[uom] ?? uom;
  }

  const productImages = $derived(product.image ? [{ src: product.image, alt: product.name }] : []);
</script>

<section class="grid gap-8 lg:grid-cols-2 lg:gap-12">
  <div>
    <ProductImageGallery
      images={productImages}
      mainImage={product.image ?? undefined}
      productName={product.name}
    />
  </div>

  <div class="flex flex-col gap-6">
    <h1 class="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>

    <div class="flex flex-wrap items-center gap-4">
      <span class="text-3xl font-bold">
        {formatPrice(product.priceCents, country)}
      </span>
      {#if isOutOfStock}
        <Badge variant="destructive" class="text-sm">Out of Stock</Badge>
      {:else if hasLowStock}
        <Badge variant="outline" class="border-amber-500 text-sm text-amber-700">Low Stock</Badge>
      {:else}
        <Badge variant="outline" class="text-sm">In Stock</Badge>
      {/if}
    </div>

    {#if product.categories.length > 0}
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span class="text-muted-foreground tracking-wide uppercase">
          {product.categories[0].name}
        </span>
      </div>
    {/if}

    <div class="border-t"></div>

    {#if product.description}
      <div class="space-y-2">
        <h2 class="text-lg font-semibold">About This Product</h2>
        <p class="text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      <div class="border-t"></div>
    {/if}

    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Product Details</h2>
      <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <p class="text-muted-foreground">Price</p>
          <p class="font-medium">
            {formatPrice(product.priceCents, country)}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground">SKU</p>
          <p class="font-medium">{product.sku}</p>
        </div>
        {#if product.barcode}
          <div>
            <p class="text-muted-foreground">Barcode</p>
            <div class="flex items-center gap-1.5">
              <BarcodeIcon class="size-3.5" />
              <p class="font-medium">{product.barcode}</p>
            </div>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">Unit of Measure</p>
          <p class="font-medium">{formatUom(product.uom)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Current Stock</p>
          <p class="font-medium">{product.stock} units</p>
        </div>
        {#if product.lowStockThreshold != null}
          <div>
            <p class="text-muted-foreground">Low Stock Threshold</p>
            <p class="font-medium">{product.lowStockThreshold} units</p>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">Created</p>
          <p class="font-medium">{formatDate(product.createdAt, true)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Last Updated</p>
          <p class="font-medium">{formatDate(product.updatedAt, true)}</p>
        </div>
      </div>
    </div>

    {#if product.categories.length > 1}
      <div class="flex flex-wrap gap-2">
        {#each product.categories.slice(1) as category}
          <Badge variant="secondary">{category.name}</Badge>
        {/each}
      </div>
    {/if}
  </div>
</section>
