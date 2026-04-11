<script lang="ts">
  import { type CountryCode, currency } from "@repo/config";

  interface Props {
    cents: number;
    country?: CountryCode | null;
    priceClass?: string;
    decimals?: number;
  }

  let { cents, country = null, priceClass = "", decimals = 2 }: Props = $props();

  const formatted = $derived(() => {
    const amount = cents / 100;
    const compact = Math.abs(amount) >= 10_000;

    const number = new Intl.NumberFormat(undefined, {
      style: "decimal",
      ...(compact
        ? { notation: "compact" as const, maximumFractionDigits: 2 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    }).format(amount);

    if (!country) return number;

    const config = currency[country];
    if (!config) return number;
    if (config.prefix) {
      if (number.startsWith("-")) return `-${config.prefix}${number.slice(1)}`;
      return `${config.prefix}${number}`;
    }
    if (config.suffix) return `${number} ${config.suffix}`;
    return number;
  });
</script>

<span class={priceClass}>{formatted()}</span>
