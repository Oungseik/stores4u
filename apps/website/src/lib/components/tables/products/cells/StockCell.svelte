<script lang="ts">
  import { Badge } from "@repo/ui/badge";

  type Props = {
    stock: number;
    lowStockThreshold: number | null;
  };

  const { stock, lowStockThreshold }: Props = $props();

  const threshold = $derived(lowStockThreshold ?? 10);
  const isOutOfStock = $derived(stock === 0);
  const isLowStock = $derived(stock > 0 && stock <= threshold);
</script>

<div class="flex items-center gap-2">
  <span class="font-medium" class:text-red-600={isOutOfStock} class:text-amber-600={isLowStock}>
    {stock}
  </span>
  {#if isOutOfStock}
    <Badge variant="outline" class="border-red-200 bg-red-500/10 text-red-600">Out of Stock</Badge>
  {:else if isLowStock}
    <Badge variant="outline" class="border-amber-200 bg-amber-500/10 text-amber-600">
      Low Stock
    </Badge>
  {/if}
</div>
