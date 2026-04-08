<script lang="ts">
  type Props = {
    reason: string | null;
  };

  const { reason }: Props = $props();
</script>

{#if reason}
  <span class="max-w-[200px] truncate inline-block align-bottom" title={reason}>{reason}</span>
{/if}
