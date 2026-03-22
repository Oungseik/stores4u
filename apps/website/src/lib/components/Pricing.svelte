<script lang="ts">
  import { type CountryCode, currency } from "@repo/config";

  interface Props {
    cents: number;
    country?: CountryCode | null;
    priceClass?: string;
    decimals?: number;
  }

  let {
    cents,
    country = null,
    priceClass = "",
    decimals = 2,
  }: Props = $props();

  const formatted = $derived(() => {
    if (!country) return (cents / 100).toFixed(decimals);
    const code = currency[country]?.code;
    if (!code) return (cents / 100).toFixed(decimals);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(cents / 100);
  });
</script>

<span class={priceClass}>{formatted()}</span>
