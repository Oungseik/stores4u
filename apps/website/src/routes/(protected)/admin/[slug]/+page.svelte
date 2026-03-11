<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import PackageIcon from "@lucide/svelte/icons/package";
  import * as Card from "@repo/ui/card";

  const mockProducts = [
    { id: 1, name: "Coffee Beans", sku: "CB-001", price: 12.99, stock: 5, category: "Beverages" },
    { id: 2, name: "Green Tea", sku: "GT-002", price: 8.49, stock: 24, category: "Beverages" },
    { id: 3, name: "Chocolate Bar", sku: "CH-003", price: 3.99, stock: 50, category: "Snacks" },
    { id: 4, name: "Sandwich", sku: "SW-004", price: 6.99, stock: 12, category: "Food" },
    { id: 5, name: "Water Bottle", sku: "WB-005", price: 1.99, stock: 100, category: "Beverages" },
  ];
</script>

<section class="overflow-y-auto p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-lg font-semibold">Products</h2>
  </div>

  <div class="space-y-1.5">
    {#each mockProducts as product}
      <Card.Root class="overflow-hidden p-0">
        <Card.Content class="p-0">
          <button
            type="button"
            class="hover:bg-muted/50 justi flex w-full items-center gap-2.5 px-3 py-2 text-left"
          >
            <div class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
              <PackageIcon class="text-muted-foreground size-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div>
                <p class="truncate text-sm font-medium">{product.name}</p>

                <div class="text-muted-foreground text-xs">
                  {product.sku} • {product.category}
                </div>
              </div>
            </div>

            <span class="text-muted-foreground text-xs">{product.stock} left</span>

            <p class="text-sm font-semibold">${product.price.toFixed(2)}</p>
            <ChevronRightIcon class="text-muted-foreground size-4 shrink-0" />
          </button>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</section>
