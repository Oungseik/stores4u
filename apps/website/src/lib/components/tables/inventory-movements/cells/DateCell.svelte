<script lang="ts">
  import { formatDate } from "$lib/utils";

  type Props = {
    date: Date;
  };

  const { date }: Props = $props();
</script>

<span class="text-muted-foreground text-sm">{formatDate(date, true)}</span>
