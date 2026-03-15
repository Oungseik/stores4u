<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import * as Command from "@repo/ui/command";
  import { ScrollArea } from "@repo/ui/scroll-area";

  import Pricing from "$lib/components/Pricing.svelte";

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
    country?: string;
    searchQuery: string;
    onSelect: (product: Product) => void;
  }

  let { products, isLoading, country, searchQuery, onSelect }: Props = $props();

  function handleSelect(product: Product) {
    onSelect(product);
  }
</script>

<Command.Root
  class="bg-popover absolute top-full right-0 left-0 z-50 h-fit overflow-hidden rounded-md border shadow-md"
>
  <Command.List>
    {#if isLoading}
      <div class="flex h-20 items-center justify-center">
        <Loader2Icon class="text-muted-foreground size-5 animate-spin" />
      </div>
    {:else if products.length === 0 && searchQuery.length > 0}
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
                  {product.barcode || product.sku || "No barcode"}
                </p>
              </div>
              <Pricing
                cents={product.priceCents}
                country={(country as "MM" | "TH" | "US") ?? null}
                priceClass="text-sm font-semibold"
              />
            </Command.Item>
          {/each}
        </Command.Group>
      </ScrollArea>
    {/if}
  </Command.List>
</Command.Root>
