<script lang="ts">
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import StoreIcon from "@lucide/svelte/icons/store";
  import AlertTriangleIcon from "@lucide/svelte/icons/triangle-alert";
  import { Alert, AlertDescription, AlertTitle } from "@repo/ui/alert";
  import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Skeleton } from "@repo/ui/skeleton";

  import { goto } from "$app/navigation";
  import { listMyShops } from "$lib/remote/shops/list_my_shops.remote";

  let shopsQuery = $state(listMyShops());
  let hasShop = $state(false);

  function formatDate(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="min-h-svh bg-background">
  <div class="mx-auto max-w-5xl px-6 py-10">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">Your Shops</h1>
      <Button
        disabled={hasShop}
        title={hasShop ? "You can only create one shop at this time." : undefined}
        onclick={() => goto("/shops/setup")}
      >
        <PlusIcon class="size-4" />
        Create Shop
      </Button>
    </div>

    {#await shopsQuery}
      <div class="space-y-4">
        {#each Array(2) as _, i (i)}
          <Card.Root class="stagger-item" style="--stagger-delay: {i * 50}ms">
            <Card.Content class="flex items-center gap-4">
              <Skeleton class="size-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-5 w-1/3" />
                <Skeleton class="h-4 w-1/4" />
                <div class="flex gap-2">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-4 w-20" />
                </div>
              </div>
              <Skeleton class="h-9 w-24" />
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:then { items: shopsList }}
      {((hasShop = shopsList.length > 0), "")}

      {#if shopsList.length === 0}
        <div class="stagger-item flex flex-col items-center justify-center py-20">
          <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <StoreIcon class="size-6 text-primary" />
          </div>
          <h2 class="mt-4 text-xl font-semibold">You haven't created a shop yet</h2>
          <p class="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Set up your first shop to start managing products, orders, and customers.
          </p>
          <Button onclick={() => goto("/shops/setup")} class="mt-6">
            <PlusIcon class="size-4" />
            Create Your First Shop
          </Button>
        </div>
      {:else if shopsList.length === 1}
        {@const shop = shopsList[0]}
        <Card.Root
          class="stagger-item group transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-md"
        >
          <Card.Content class="flex items-center gap-4">
            <Avatar class="size-10">
              <AvatarImage src={shop.info?.logo ?? undefined} alt={shop.name} />
              <AvatarFallback class="text-sm font-medium">
                {shop.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-semibold">{shop.name}</h2>
              <p class="text-sm text-muted-foreground">/{shop.slug}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={shop.isActive ? "default" : "secondary"}>
                  {shop.isActive ? "Active" : "Inactive"}
                </Badge>
                {#if shop.info}
                  <span class="text-xs text-muted-foreground">
                    {shop.info.city}, {shop.info.country}
                  </span>
                {/if}
                <span class="text-xs text-muted-foreground">
                  Created {formatDate(shop.createdAt)}
                </span>
              </div>
            </div>
            <Button onclick={() => goto(`/shop/${shop.slug}`)}>
              Enter Shop
              <ArrowRightIcon class="size-4" />
            </Button>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          {#each shopsList as shop, i (shop.id)}
            <Card.Root
              class="stagger-item group cursor-pointer transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-md"
              style="--stagger-delay: {i * 50}ms"
              role="button"
              tabindex={0}
              onclick={() => goto(`/shop/${shop.slug}`)}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goto(`/shop/${shop.slug}`);
                }
              }}
            >
              <Card.Content class="flex items-center gap-4">
                <Avatar class="size-10">
                  <AvatarImage src={shop.info?.logo ?? undefined} alt={shop.name} />
                  <AvatarFallback class="text-sm font-medium">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg font-semibold">{shop.name}</h3>
                  <p class="text-sm text-muted-foreground">/{shop.slug}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={shop.isActive ? "default" : "secondary"}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {#if shop.info}
                      <span class="text-xs text-muted-foreground">
                        {shop.info.city}, {shop.info.country}
                      </span>
                    {/if}
                    <span class="text-xs text-muted-foreground">
                      Created {formatDate(shop.createdAt)}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}

          <Card.Root
            class="stagger-item group cursor-pointer border-dashed transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-md"
            style="--stagger-delay: {shopsList.length * 50}ms"
            role="button"
            tabindex={0}
            onclick={() => goto("/shops/setup")}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goto("/shops/setup");
              }
            }}
          >
            <Card.Content class="flex flex-col items-center justify-center gap-3 py-8">
              <div class="flex size-10 items-center justify-center rounded-full bg-muted">
                <PlusIcon class="size-5 text-muted-foreground" />
              </div>
              <p class="text-sm font-medium">Create New Shop</p>
            </Card.Content>
          </Card.Root>
        </div>
      {/if}
    {:catch error}
      {((hasShop = false), "")}
      <Alert variant="destructive" class="stagger-item">
        <AlertTriangleIcon class="size-4" />
        <AlertTitle>Error loading shops</AlertTitle>
        <AlertDescription class="mt-2 flex flex-col gap-3">
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load your shops. Please try again."}
          </span>
          <Button variant="outline" size="sm" class="w-fit" onclick={listMyShops().refresh}
            >Try Again</Button
          >
        </AlertDescription>
      </Alert>
    {/await}
  </div>
</div>

<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stagger-item {
    opacity: 0;
    animation: fadeInUp 150ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
    animation-delay: var(--stagger-delay, 0ms);
  }

  @media (prefers-reduced-motion: reduce) {
    .stagger-item {
      animation: none;
      opacity: 1;
    }
  }
</style>
