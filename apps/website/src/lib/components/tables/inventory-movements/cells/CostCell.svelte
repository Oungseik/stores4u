<script lang="ts">
  import type { CountryCode } from "@repo/config";

  import Pricing from "$lib/components/Pricing.svelte";

  type Props = {
    cents: number | null;
    country: CountryCode | null;
  };

  const { cents, country }: Props = $props();
</script>

{#if cents !== null}
  <span class="font-medium">
    <Pricing {cents} {country} />
  </span>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
