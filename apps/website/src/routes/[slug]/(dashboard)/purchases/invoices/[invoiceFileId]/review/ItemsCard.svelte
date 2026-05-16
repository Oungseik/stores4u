<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { type CurrencyCode } from "@repo/config";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import { NumberInput } from "@repo/ui/number-input";

  import QuickProductForm from "$lib/components/forms/QuickProductForm.svelte";
  import { calcLineTotalCents, formatPrice } from "$lib/utils";

  import ProductSearchPopover from "./ProductSearchPopover.svelte";

  export type InvoiceItem = {
    id: string;
    invoiceItemName: string;
    productId?: string;
    matchedProductName?: string;
    qty: number;
    unitCost: number;
    saveAlias?: boolean;
  };

  export type ProductOption = {
    id: string;
    name: string;
    sku: string;
  };

  let {
    items = $bindable([]),
    products = [],
    slug,
    currency,
    onProductCreated,
  }: {
    items: InvoiceItem[];
    products: ProductOption[];
    slug: string;
    currency: CurrencyCode;
    onProductCreated?: (product: { id: string; name: string; sku: string }) => void;
  } = $props();

  let productSearchOpen = $state<string | null>(null);
  let createProductSheetOpen = $state(false);
  let createProductForItemId = $state<string | null>(null);

  const lineTotalsCents = $derived(
    items.map((item) => calcLineTotalCents(item.qty, item.unitCost))
  );

  const hasUnmatchedItems = $derived(items.some((i) => !i.productId));

  function addItem() {
    const newItemId = `item-${Date.now()}`;
    items = [
      ...items,
      {
        id: newItemId,
        invoiceItemName: "",
        qty: 1,
        unitCost: 0,
      },
    ];
  }

  function removeItem(itemId: string) {
    items = items.filter((i) => i.id !== itemId);
  }

  function selectProduct(itemId: string, product: ProductOption) {
    items = items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            productId: product.id,
            matchedProductName: product.name,
            invoiceItemName: product.name,
            saveAlias: true,
          }
        : i
    );
    productSearchOpen = null;
  }

  function clearProduct(itemId: string) {
    items = items.map((i) =>
      i.id === itemId
        ? { ...i, productId: undefined, matchedProductName: undefined, saveAlias: undefined }
        : i
    );
  }

  function openCreateProductSheet(itemId: string) {
    productSearchOpen = null;
    createProductForItemId = itemId;
    createProductSheetOpen = true;
  }

  function handleProductCreated(product: { id: string; name: string; sku: string }) {
    onProductCreated?.(product);
    if (createProductForItemId) {
      selectProduct(createProductForItemId, product);
    }
    createProductSheetOpen = false;
    createProductForItemId = null;
  }

  const createFormTargetItem = $derived(items.find((i) => i.id === createProductForItemId));

  const createFormInitialName = $derived(createFormTargetItem?.invoiceItemName ?? "");

  const createFormInitialPriceCents = 0;
</script>

<Card.Root class="pb-0">
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <PackageIcon class="size-4" />
      Items ({items.length})
    </Card.Title>
    {#if hasUnmatchedItems}
      <Card.Description class="text-amber-700 dark:text-amber-400">
        Highlighted items are not matched to a product from the product list.
      </Card.Description>
    {/if}
    <Card.Action>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={addItem}>
          <PlusIcon class="size-4" />
          Add Item
        </Button>
      </div>
    </Card.Action>
  </Card.Header>
  <Card.Content class="p-0">
    {#if items.length === 0}
      <div class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
        <PackageIcon class="size-10 opacity-50" />
        <p class="text-sm">No items yet</p>
        <Button variant="outline" size="sm" onclick={addItem}>
          <PlusIcon class="size-4" />
          Add first item
        </Button>
      </div>
    {:else}
      <div class="divide-y">
        {#each items as item, index (item.id)}
          <div class="hover:bg-muted/30 transition-colors">
            <div class="flex flex-col gap-2 p-3 xl:flex-row xl:items-start">
              <ProductSearchPopover
                {item}
                {products}
                open={productSearchOpen === item.id}
                onOpenChange={(open) => {
                  productSearchOpen = open ? item.id : null;
                }}
                onSelectProduct={(product) => selectProduct(item.id, product)}
                onClearProduct={() => clearProduct(item.id)}
                onCreateProduct={() => openCreateProductSheet(item.id)}
              />

              <div class="flex shrink-0 items-center gap-2">
                <NumberInput bind:value={item.qty} class="w-16 text-center" fraction={0} min={0} />
                <span class="text-muted-foreground text-xs">×</span>
                <NumberInput
                  bind:value={item.unitCost}
                  class="w-24 text-right"
                  fraction={2}
                  min={0}
                />
                <span class="text-muted-foreground text-xs">=</span>
                <span class="min-w-[4rem] text-sm font-medium tabular-nums">
                  {formatPrice(lineTotalsCents[index], currency, false)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 shrink-0 text-red-500 hover:text-red-700"
                  onclick={() => removeItem(item.id)}
                >
                  <Trash2Icon class="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>

<!-- Inline product creation dialog -->
<Dialog.Root bind:open={createProductSheetOpen}>
  <Dialog.Content class="max-h-[85vh] overflow-y-auto px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Create New Product</Dialog.Title>
      <Dialog.Description>
        Add a new product to your catalog. It will be linked to this invoice item.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-3 py-4 sm:px-4">
      <QuickProductForm
        {slug}
        initialName={createFormInitialName}
        initialPriceCents={createFormInitialPriceCents}
        onCreated={handleProductCreated}
        onCancel={() => {
          createProductSheetOpen = false;
          createProductForItemId = null;
        }}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
