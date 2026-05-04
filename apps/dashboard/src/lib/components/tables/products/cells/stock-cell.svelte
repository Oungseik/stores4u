<script lang="ts">
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
  <span
    class={[
      "font-medium",
      isOutOfStock
        ? "text-red-700 dark:text-red-400"
        : isLowStock
          ? "text-amber-700 dark:text-amber-400"
          : "",
    ]}
  >
    {stock}
  </span>
  {#if isOutOfStock}
    <span
      class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
    >
      Out of Stock
    </span>
  {:else if isLowStock}
    <span
      class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    >
      Low Stock
    </span>
  {/if}
</div>
