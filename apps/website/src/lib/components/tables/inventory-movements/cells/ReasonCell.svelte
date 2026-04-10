<script lang="ts">
  type Props = {
    reason: string | null;
  };

  const { reason }: Props = $props();
</script>

{#if reason}
  <span class="inline-block max-w-[200px] truncate align-bottom" title={reason}>{reason}</span>
{/if}
