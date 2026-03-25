<script lang="ts">
  type Props = {
    stock: number;
  };

  const { stock }: Props = $props();
</script>

<span class="font-medium" class:text-red-600={stock <= 0} class:text-amber-600={stock > 0 && stock < 10}>
  {stock}
</span>
