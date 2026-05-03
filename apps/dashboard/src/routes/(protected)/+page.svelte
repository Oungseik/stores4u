<script lang="ts">
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import StoreIcon from "@lucide/svelte/icons/store";
  import AlertTriangleIcon from "@lucide/svelte/icons/triangle-alert";
  import { Alert, AlertDescription, AlertTitle } from "@repo/ui/alert";
  import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Skeleton } from "@repo/ui/skeleton";

  import { listMyShops } from "$lib/remote/shops/list_my_shops.remote";

  let shopsQuery = $state(listMyShops());
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
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">Your Shops</h1>
      <a href="/shops/setup" class={buttonVariants()}>
        <PlusIcon class="size-4" />
        Create Shop
      </a>
    </div>

    {#await shopsQuery}
      <div class="space-y-4">
        {#each Array(2) as _, i (i)}
          <Card.Root>
            <Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Skeleton class="size-10 rounded-full" />
              <div class="min-w-0 flex-1 space-y-2">
                <Skeleton class="h-5 w-1/3" />
                <Skeleton class="h-4 w-1/4" />
                <div class="flex gap-2">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-4 w-20" />
                </div>
              </div>
              <Skeleton class="h-9 w-full sm:w-24" />
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:then { items: shopsList }}
      {#if shopsList.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <StoreIcon class="size-6 text-primary" />
          </div>
          <h2 class="mt-4 text-xl font-semibold">You haven't created a shop yet</h2>
          <p class="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Set up your first shop to start managing products, orders, and customers.
          </p>
          <a href="/shops/setup" class={buttonVariants({ class: "mt-6" })}>
            <PlusIcon class="size-4" />
            Create Your First Shop
          </a>
        </div>
      {:else if shopsList.length === 1}
        {@const shop = shopsList[0]}
        <Card.Root class="group transition-shadow hover:shadow-md">
          <Card.Content class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
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
            <a href="/shops/{shop.slug}" class={buttonVariants({ class: "w-full sm:w-auto" })}>
              Enter Shop
              <ArrowRightIcon class="size-4" />
            </a>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          {#each shopsList as shop (shop.id)}
            <a
              href="/shops/{shop.slug}"
              class="group block cursor-pointer rounded-xl transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-md"
            >
              <Card.Root class="h-full">
                <Card.Content class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
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
            </a>
          {/each}

          <a href="/shops/setup" class="block">
            <Card.Root
              class="group cursor-pointer border-dashed transition-all hover:-translate-y-px hover:border-primary/50 hover:shadow-md"
            >
              <Card.Content class="flex flex-col items-center justify-center gap-3 py-8">
                <div class="flex size-10 items-center justify-center rounded-full bg-muted">
                  <PlusIcon class="size-5 text-muted-foreground" />
                </div>
                <p class="text-sm font-medium">Create New Shop</p>
              </Card.Content>
            </Card.Root>
          </a>
        </div>
      {/if}
    {:catch error}
      <Alert variant="destructive">
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
