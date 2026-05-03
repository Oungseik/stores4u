<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
  <h1 class="text-2xl font-bold">{data.shop.name}</h1>
  <p class="text-muted-foreground">Welcome to your shop dashboard.</p>
</div>
