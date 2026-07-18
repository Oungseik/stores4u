<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import BarcodeIcon from "@lucide/svelte/icons/barcode";
  import { type CurrencyCode } from "@repo/config";
  import { Badge } from "@repo/ui/badge";

  import ProductImageGallery from "$lib/components/ProductImageGallery.svelte";
  import { formatDate, formatPrice, formatUom } from "$lib/utils";

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
    currency: CurrencyCode;
  }

  let { product, hasLowStock, isOutOfStock, currency }: Props = $props();

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
        {formatPrice(product.priceCents, currency)}
      </span>
      {#if isOutOfStock}
        <Badge variant="destructive" class="text-sm">{msg.ui_out_of_stock()}</Badge>
      {:else if hasLowStock}
        <Badge variant="outline" class="border-amber-500 text-sm text-amber-700"
          >{msg.ui_low_stock()}</Badge
        >
      {:else}
        <Badge variant="outline" class="text-sm">{msg.ui_in_stock()}</Badge>
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
        <h2 class="text-lg font-semibold">{msg.ui_about_this_product()}</h2>
        <p class="text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      <div class="border-t"></div>
    {/if}

    <div class="space-y-4">
      <h2 class="text-lg font-semibold">{msg.ui_product_details()}</h2>
      <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <p class="text-muted-foreground">{msg.ui_price()}</p>
          <p class="font-medium">
            {formatPrice(product.priceCents, currency)}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground">{msg.ui_sku()}</p>
          <p class="font-medium">{product.sku}</p>
        </div>
        {#if product.barcode}
          <div>
            <p class="text-muted-foreground">{msg.ui_barcode()}</p>
            <div class="flex items-center gap-1.5">
              <BarcodeIcon class="size-3.5" />
              <p class="font-medium">{product.barcode}</p>
            </div>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">{msg.ui_unit_of_measure()}</p>
          <p class="font-medium">{formatUom(product.uom)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">{msg.ui_current_stock()}</p>
          <p class="font-medium">{product.stock} units</p>
        </div>
        {#if product.lowStockThreshold != null}
          <div>
            <p class="text-muted-foreground">{msg.ui_low_stock_threshold()}</p>
            <p class="font-medium">{product.lowStockThreshold} units</p>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">{msg.ui_created()}</p>
          <p class="font-medium">{formatDate(product.createdAt, true)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">{msg.ui_last_updated()}</p>
          <p class="font-medium">{formatDate(product.updatedAt, true)}</p>
        </div>
      </div>
    </div>

    {#if product.categories.length > 1}
      <div class="flex flex-wrap gap-2">
        {#each product.categories.slice(1) as category (category.id)}
          <Badge variant="secondary">{category.name}</Badge>
        {/each}
      </div>
    {/if}
  </div>
</section>
