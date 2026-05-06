<script lang="ts">
  import { type CurrencyCode } from "@repo/config";
  import * as Card from "@repo/ui/card";
  import type { Component, Snippet } from "svelte";

  import { formatPrice } from "$lib/utils";

  interface Props {
    title: string;
    value?: string | number;
    description: string;
    icon: Component<{ class?: string }>;
    iconBgClass?: string;
    iconTextClass?: string;
    price?: number;
    currency?: CurrencyCode;
    priceClass?: string;
    footer?: Snippet;
  }

  let {
    title,
    value,
    description,
    iconBgClass = "bg-muted",
    iconTextClass = "",
    price,
    currency = "USD",
    priceClass = "text-2xl font-bold",
    footer,
    ...props
  }: Props = $props();
</script>

<Card.Root class="relative overflow-hidden">
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-sm font-medium">{title}</Card.Title>
    <div class="rounded-md p-2 {iconBgClass}">
      <props.icon class="size: 5 lg:size-6 {iconTextClass}" />
    </div>
  </Card.Header>
  <Card.Content>
    <div class={priceClass}>
      {#if price !== undefined}
        {formatPrice(price, currency)}
      {:else}
        {value}
      {/if}
    </div>
    <p class="text-muted-foreground text-xs">{description}</p>
  </Card.Content>
  {#if footer}
    <Card.Footer class="pt-0">
      {@render footer()}
    </Card.Footer>
  {/if}
</Card.Root>
