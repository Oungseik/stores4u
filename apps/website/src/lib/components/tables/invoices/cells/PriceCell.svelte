<script lang="ts">
  import type { CountryCode } from "@repo/config";

  import Pricing from "$lib/components/Pricing.svelte";

  type Props = {
    cents: number;
    country: CountryCode | null;
  };

  const { cents, country }: Props = $props();
</script>

<span class="font-medium">
  <Pricing {cents} {country} />
</span>
