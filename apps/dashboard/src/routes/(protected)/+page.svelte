<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import StoreIcon from "@lucide/svelte/icons/store";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Skeleton } from "@repo/ui/skeleton";

  import { goto } from "$app/navigation";
  import { getMyShops } from "$lib/remote/shops/get_my_shops.remote";

  const shops = getMyShops();

  function formatDate(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-2xl space-y-8">
    <div class="text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Your Shops</h1>
      <p class="mt-1 text-sm text-muted-foreground">Select a shop to manage or create a new one.</p>
    </div>

    {#await shops}
      <!-- Loading state -->
      <div class="grid gap-4 sm:grid-cols-2">
        {#each Array(2) as _, i (i)}
          <Card.Root>
            <Card.Header>
              <Skeleton class="h-5 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
            </Card.Header>
            <Card.Content>
              <Skeleton class="h-4 w-1/3" />
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:then shopsList}
      {#if shopsList.length === 0}
        <!-- Empty state -->
        <Card.Root class="border-dashed">
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <div class="flex size-12 items-center justify-center rounded-full bg-muted">
              <StoreIcon class="size-6 text-muted-foreground" />
            </div>
            <p class="mt-4 text-sm text-muted-foreground">
              You don't have a shop yet. Create one to get started.
            </p>
            <Button onclick={() => goto("/shop/setup")} class="mt-6">
              <PlusIcon class="size-4" />
              Create Your First Shop
            </Button>
          </Card.Content>
        </Card.Root>
      {:else}
        <!-- Shop cards -->
        <div class="grid gap-4 sm:grid-cols-2">
          {#each shopsList as shop (shop.id)}
            <button
              type="button"
              class="cursor-pointer text-left"
              onclick={() => goto(`/shop/${shop.slug}`)}
            >
              <Card.Root class="transition-colors hover:border-primary/50 hover:bg-accent/50">
                <Card.Header>
                  <Card.Title>{shop.name}</Card.Title>
                  <Card.Description>/{shop.slug}</Card.Description>
                </Card.Header>
                <Card.Content>
                  <p class="text-xs text-muted-foreground">
                    Created {formatDate(shop.createdAt)}
                  </p>
                </Card.Content>
              </Card.Root>
            </button>
          {/each}

          <!-- Create new shop card -->
          <button
            type="button"
            class="cursor-pointer text-left"
            onclick={() => goto("/shop/setup")}
          >
            <Card.Root
              class="border-dashed transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <Card.Content class="flex flex-col items-center justify-center py-10">
                <div class="flex size-10 items-center justify-center rounded-full bg-muted">
                  <PlusIcon class="size-5 text-muted-foreground" />
                </div>
                <p class="mt-3 text-sm font-medium">Create New Shop</p>
              </Card.Content>
            </Card.Root>
          </button>
        </div>
      {/if}
    {:catch error}
      <!-- Error state -->
      <Card.Root class="border-destructive/50">
        <Card.Content class="py-8 text-center">
          <p class="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load shops. Please try again."}
          </p>
        </Card.Content>
      </Card.Root>
    {/await}
  </div>
</div>
