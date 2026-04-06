<script lang="ts">
  type Props = {
    name: string;
    sku: string | null;
  };

  const { name, sku }: Props = $props();
</script>

<div class="min-w-0">
  <p class="truncate text-sm font-medium">{name}</p>
  {#if sku}
    <p class="text-muted-foreground truncate text-xs">{sku}</p>
  {/if}
</div>
