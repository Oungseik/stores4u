<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";

  import { formatDate } from "$lib/utils";

  type Props = {
    date: string;
  };

  const { date }: Props = $props();
</script>

<div class="text-muted-foreground flex items-center gap-1">
  <CalendarIcon class="size-3" />
  {formatDate(date)}
</div>
