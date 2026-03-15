<script lang="ts">
  import { type CountryCode, currency } from "@repo/config";

  interface Props {
    cents: number;
    country?: CountryCode | null;
    prefixClass?: string;
    priceClass?: string;
    suffixClass?: string;
    decimals?: number;
  }

  let {
    cents,
    country = null,
    prefixClass = "",
    priceClass = "",
    suffixClass = "",
    decimals = 2,
  }: Props = $props();

  const amount = $derived((cents / 100).toFixed(decimals));

  const prefix = $derived(() => {
    if (!country) return "";
    const config = currency[country];
    return config?.prefix || "";
  });

  const suffix = $derived(() => {
    if (!country) return "";
    const config = currency[country];
    return config?.suffix || "";
  });
</script>

<span class="inline-flex items-baseline">
  {#if prefix()}
    <span class={prefixClass}>{prefix()}</span>
  {/if}
  <span class={priceClass}>{amount}</span>
  {#if suffix()}
    <span class={["ml-1 text-xs font-normal", suffixClass]}>{suffix()}</span>
  {/if}
</span>
