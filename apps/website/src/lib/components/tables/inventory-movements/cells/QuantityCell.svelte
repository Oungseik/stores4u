<script lang="ts">
  type Props = {
    qty: number;
  };

  const { qty }: Props = $props();
</script>

<span class="font-medium" class:text-emerald-600={qty > 0} class:text-red-600={qty < 0}>
  {qty > 0 ? "+" : ""}{qty}
</span>
