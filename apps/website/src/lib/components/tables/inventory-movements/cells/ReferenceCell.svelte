<script lang="ts">
  type Props = {
    referenceType: string | null;
    referenceId: string | null;
    purchaseInvoiceNumber: string | null;
  };

  const { referenceType, referenceId, purchaseInvoiceNumber }: Props = $props();
</script>

<div class="text-sm">
  {#if purchaseInvoiceNumber}
    <span class="font-medium">{purchaseInvoiceNumber}</span>
  {:else if referenceType && referenceId}
    <span class="text-muted-foreground text-xs">{referenceType}</span>
    <span class="font-mono text-xs">{referenceId.slice(-8).toUpperCase()}</span>
  {:else}{/if}
</div>
