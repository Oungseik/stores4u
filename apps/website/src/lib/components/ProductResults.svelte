<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";
  import type { CurrencyCode } from "@repo/config";
  import * as Command from "@repo/ui/command";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Skeleton } from "@repo/ui/skeleton";

  import { formatPrice } from "$lib/utils";

  interface Product {
    id: string;
    name: string;
    barcode: string | null;
    sku: string | null;
    priceCents: number;
    image: string | null;
  }

  interface Props {
    products: Product[];
    isLoading: boolean;
    currency?: CurrencyCode;
    searchQuery: string;
    onSelect: (product: Product) => void;
  }

  let { products, isLoading, currency = "USD", searchQuery, onSelect }: Props = $props();

  function handleSelect(product: Product) {
    onSelect(product);
  }
</script>

<Command.Root
  class="bg-popover absolute top-full w-[calc(100%-32px)] mx-auto right-0 left-0 z-50 h-fit overflow-hidden rounded-md border shadow-md"
>
  <Command.List>
    {#if isLoading && products.length === 0}
      <div class="flex flex-col gap-2 p-2">
        {#each { length: 3 } as _}
          <div class="flex items-center gap-3 px-2 py-2">
            <Skeleton class="size-10 shrink-0 rounded-md" />
            <div class="min-w-0 flex-1 space-y-1.5">
              <Skeleton class="h-3.5 w-3/4 rounded" />
              <Skeleton class="h-3 w-1/2 rounded" />
            </div>
            <Skeleton class="h-4 w-14 rounded" />
          </div>
        {/each}
      </div>
    {:else if !isLoading && products.length === 0 && searchQuery.length > 0}
      <Command.Empty>No products found for "{searchQuery}"</Command.Empty>
    {:else}
      <ScrollArea>
        <Command.Group>
          {#each products as product (product.id)}
            <Command.Item
              value={product.name}
              onSelect={() => handleSelect(product)}
              class="flex cursor-pointer items-center gap-3 px-2 py-2"
            >
              <div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                {#if product.image}
                  <img
                    src={product.image}
                    alt={product.name}
                    class="size-full rounded-md object-cover"
                  />
                {:else}
                  <PackageIcon class="text-muted-foreground size-4" />
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{product.name}</p>
                <p class="text-muted-foreground text-xs">
                  {product.sku || product.barcode || "No sku or barcode"}
                </p>
              </div>
              <span class="text-sm font-semibold">
                {formatPrice(product.priceCents, currency)}
              </span>
            </Command.Item>
          {/each}
        </Command.Group>
      </ScrollArea>
    {/if}
  </Command.List>
</Command.Root>
