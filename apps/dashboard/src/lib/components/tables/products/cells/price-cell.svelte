<script lang="ts">
  import type { CountryCode } from "@repo/config";

  import { formatPrice } from "$lib/utils/format-price";

  type Props = {
    cents: number;
    country: CountryCode | null;
  };

  const { cents, country }: Props = $props();
</script>

<span class="font-medium">{formatPrice(cents, country)}</span>
