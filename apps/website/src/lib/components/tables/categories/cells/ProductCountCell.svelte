<script lang="ts">
  type Props = {
    count: number;
  };

  const { count }: Props = $props();
</script>

<span class="text-muted-foreground">
  {count}
  {count === 1 ? "product" : "products"}
</span>
