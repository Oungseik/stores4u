<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import PlusCircleIcon from "@lucide/svelte/icons/plus-circle";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Command from "@repo/ui/command";
  import * as Popover from "@repo/ui/popover";
  import { tick } from "svelte";

  import type { InvoiceItem, ProductOption } from "./ItemsCard.svelte";

  let {
    item,
    products,
    open,
    onOpenChange,
    onSelectProduct,
    onClearProduct,
    onCreateProduct,
  }: {
    item: InvoiceItem;
    products: ProductOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectProduct: (product: ProductOption) => void;
    onClearProduct: () => void;
    onCreateProduct: () => void;
  } = $props();

  let productSearch = $state("");
  let commandInputRef: HTMLInputElement | null = $state(null);

  const filteredProducts = $derived.by(() => {
    const search = productSearch.toLowerCase().trim();
    if (!search) return products.slice(0, 20);
    return products
      .filter((p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search))
      .slice(0, 20);
  });

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      productSearch = "";
      tick().then(() => commandInputRef?.focus());
    }
    onOpenChange(newOpen);
  }

  function handleSearchInput() {
    item.invoiceItemName = productSearch;
  }
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger class="min-w-0 flex-1 text-left">
    <div
      class="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-sm
        {item.productId
        ? 'border-input bg-background'
        : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'}"
    >
      {#if item.productId && item.matchedProductName}
        <CheckIcon class="size-3.5 shrink-0 text-green-600" />
        <span class="truncate text-sm font-medium">{item.matchedProductName}</span>
        <button
          class="hover:bg-muted ml-auto shrink-0 rounded-sm p-0.5"
          onclick={(e) => {
            e.stopPropagation();
            onClearProduct();
          }}
        >
          <XIcon class="text-muted-foreground size-3.5" />
        </button>
      {:else}
        <XIcon class="size-3.5 shrink-0 text-amber-600" />
        <span
          class="truncate {item.invoiceItemName
            ? 'text-foreground'
            : 'text-amber-700 dark:text-amber-400'}"
        >
          {item.invoiceItemName || "Item name..."}
        </span>
      {/if}
    </div>
  </Popover.Trigger>
  <Popover.Content class="z-10 w-80 p-0" align="start">
    <Command.Root shouldFilter={false}>
      <Command.Input
        bind:ref={commandInputRef}
        bind:value={productSearch}
        placeholder="Type name or search products..."
        oninput={handleSearchInput}
      />
      <Command.List>
        <Command.Item
          class="mt-2 py-3"
          forceMount
          keywords={["create", "new", "product"]}
          onSelect={onCreateProduct}
        >
          <PlusCircleIcon class="size-4" />
          Create new product
        </Command.Item>
        <Command.Separator />

        {#each filteredProducts as product (product.id)}
          <Command.Item value={product.name} onSelect={() => onSelectProduct(product)}>
            <CheckIcon class={["size-4", item.productId !== product.id && "text-transparent"]} />
            <div class="flex flex-col">
              <span>{product.name}</span>
              <span class="text-muted-foreground text-xs">{product.sku}</span>
            </div>
          </Command.Item>
        {/each}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
