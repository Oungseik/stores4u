<script lang="ts">
  import ReceiptIcon from "@lucide/svelte/icons/receipt";

  type Props = {
    id: string;
  };

  const { id }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <ReceiptIcon class="text-muted-foreground size-4" />
  <span class="font-medium">{id}</span>
</div>
