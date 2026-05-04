<script lang="ts">
  import { type CountryCode } from "@repo/config";
  import * as Card from "@repo/ui/card";
  import type { Component, Snippet } from "svelte";

  import { formatPrice } from "$lib/utils/format-price";

  interface Props {
    title: string;
    value?: string | number;
    description: string;
    icon: Component<{ class?: string }>;
    iconBgClass?: string;
    iconTextClass?: string;
    price?: number;
    country?: CountryCode | null;
    priceClass?: string;
    footer?: Snippet;
  }

  let {
    title,
    value,
    description,
    icon,
    iconBgClass = "bg-muted",
    iconTextClass = "",
    price,
    country = "US",
    priceClass = "text-2xl font-bold",
    footer,
  }: Props = $props();

  const Icon = $derived(icon);
</script>

<Card.Root class="relative overflow-hidden">
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-sm font-medium">{title}</Card.Title>
    <div class="rounded-md p-2 {iconBgClass}">
      <Icon class="size-5 lg:size-6 {iconTextClass}" />
    </div>
  </Card.Header>
  <Card.Content>
    <div class={priceClass}>
      {#if price !== undefined}
        {formatPrice(price, country)}
      {:else}
        {value}
      {/if}
    </div>
    <p class="text-xs text-muted-foreground">{description}</p>
  </Card.Content>
  {#if footer}
    <Card.Footer class="pt-0">
      {@render footer()}
    </Card.Footer>
  {/if}
</Card.Root>
