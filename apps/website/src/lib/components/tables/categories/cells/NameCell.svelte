<script lang="ts">
  type Props = {
    name: string;
  };

  const { name }: Props = $props();
</script>

<span class="font-medium">{name}</span>
