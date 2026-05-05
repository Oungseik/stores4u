<script lang="ts">
  import type { CurrencyCode } from "@repo/config";

  import { formatPrice } from "$lib/utils";

  type Props = {
    cents: number;
    currency: CurrencyCode | null;
  };

  const { cents, currency }: Props = $props();
</script>

<span class="font-medium">
  {formatPrice(cents, currency)}
</span>
