<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import PlusCircleIcon from "@lucide/svelte/icons/plus-circle";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import { NumberInput } from "@repo/ui/number-input";
  import * as Popover from "@repo/ui/popover";
  import { Debounced } from "runed";

  import QuickProductForm from "$lib/components/forms/QuickProductForm.svelte";
  import { calcLineTotalCents, formatPrice } from "$lib/utils";

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
    onProductCreated,
  }: {
    items: InvoiceItem[];
    products: ProductOption[];
    slug: string;
    onProductCreated?: (product: { id: string; name: string; sku: string }) => void;
  } = $props();

  let productSearchOpen = $state<string | null>(null);
  let productSearch = $state("");
  let createProductSheetOpen = $state(false);
  let createProductForItemId = $state<string | null>(null);

  const debouncedSearch = new Debounced(() => productSearch, 200);

  const filteredProducts = $derived.by(() => {
    const search = debouncedSearch.current?.toLowerCase().trim() ?? "";
    if (!search) return products.slice(0, 20);
    return products
      .filter((p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))
      .slice(0, 20);
  });

  const lineTotalsCents = $derived(
    items.map((item) => calcLineTotalCents(item.qty, item.unitCost))
  );

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
            saveAlias: true,
          }
        : i
    );
    productSearchOpen = null;
    productSearch = "";
  }

  function clearProduct(itemId: string) {
    items = items.map((i) =>
      i.id === itemId ? { ...i, productId: undefined, matchedProductName: undefined } : i
    );
  }

  function openCreateProductSheet(itemId: string) {
    productSearchOpen = null;
    productSearch = "";
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
  <Card.Header class="flex flex-row items-center justify-between">
    <Card.Title class="flex items-center gap-2">
      <PackageIcon class="size-4" />
      Items ({items.length})
    </Card.Title>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={addItem}>
        <PlusIcon class="size-4" />
        Add Item
      </Button>
    </div>
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
            <div class="flex flex-col gap-3 p-3 lg:flex-row lg:items-end">
              <div class="flex w-full flex-col gap-2">
                <div class="flex flex-col gap-4 lg:flex-row">
                  <Input
                    bind:value={item.invoiceItemName}
                    placeholder="Item name"
                    class="text-sm font-medium"
                  />

                  <div class="flex items-center gap-2">
                    <NumberInput
                      bind:value={item.qty}
                      class="w-16 text-center"
                      fraction={0}
                      min={0}
                    />
                    <span class="text-muted-foreground text-xs">×</span>
                    <NumberInput
                      bind:value={item.unitCost}
                      class="w-24 text-right"
                      fraction={2}
                      min={0}
                    />
                    <span class="text-muted-foreground text-xs">=</span>
                    <span class="min-w-[4rem] font-medium tabular-nums">
                      {formatPrice(lineTotalsCents[index])}
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
                <div class="flex items-center gap-2">
                  <Popover.Root
                    open={productSearchOpen === item.id}
                    onOpenChange={(open) => {
                      productSearchOpen = open ? item.id : null;
                      if (open) productSearch = "";
                    }}
                  >
                    <Popover.Trigger class="min-w-0 flex-1">
                      <div
                        class="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm
                          {item.productId
                          ? 'border-input bg-background'
                          : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'}"
                      >
                        {#if item.productId && item.matchedProductName}
                          <CheckIcon class="size-3.5 shrink-0 text-green-600" />
                          <span class="truncate text-sm font-medium">{item.matchedProductName}</span
                          >
                        {:else}
                          <XIcon class="size-3.5 shrink-0 text-amber-600" />
                          <span class="truncate text-amber-700 dark:text-amber-400"
                            >Select product...</span
                          >
                        {/if}
                      </div>
                    </Popover.Trigger>
                    <Popover.Content class="z-10 w-72 p-0" align="start">
                      <Command.Root>
                        <Command.Input
                          placeholder="Search products..."
                          value={productSearch}
                          oninput={(e) => (productSearch = e.currentTarget.value)}
                        />
                        <Command.List>
                          <Command.Empty>
                            <div class="flex flex-col items-center gap-2 py-4">
                              <p class="text-muted-foreground text-sm">No products found</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onclick={() => openCreateProductSheet(item.id)}
                              >
                                <PlusCircleIcon class="mr-1 size-4" />
                                Create new product
                              </Button>
                            </div>
                          </Command.Empty>
                          {#each filteredProducts as product (product.id)}
                            <Command.Item
                              value={product.name}
                              onSelect={() => selectProduct(item.id, product)}
                            >
                              <CheckIcon
                                class={[
                                  "size-4",
                                  item.productId !== product.id && "text-transparent",
                                ]}
                              />
                              <div class="flex flex-col">
                                <span>{product.name}</span>
                                <span class="text-muted-foreground text-xs">{product.sku}</span>
                              </div>
                            </Command.Item>
                          {/each}
                          {#if filteredProducts.length > 0}
                            <Command.Separator />
                            <Command.Item
                              value="__create_new__"
                              onSelect={() => openCreateProductSheet(item.id)}
                            >
                              <PlusCircleIcon class="size-4" />
                              Create new product
                            </Command.Item>
                          {/if}
                        </Command.List>
                      </Command.Root>
                    </Popover.Content>
                  </Popover.Root>

                  {#if item.productId}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-foreground size-8 shrink-0"
                      onclick={() => clearProduct(item.id)}
                    >
                      <XIcon class="size-3.5" />
                    </Button>
                  {/if}
                </div>
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
  <Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Create New Product</Dialog.Title>
      <Dialog.Description>
        Add a new product to your catalog. It will be linked to this invoice item.
      </Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
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
