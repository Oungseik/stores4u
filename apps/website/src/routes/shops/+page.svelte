<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import StoreIcon from "@lucide/svelte/icons/store";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";

  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
</script>

<div class="bg-background min-h-svh">
  <div class="mx-auto max-w-5xl px-6 py-10">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">Your Shops</h1>
      <a href="/shops/setup" class={buttonVariants()}>
        <PlusIcon class="size-4" />
        Create Shop
      </a>
    </div>

    {#if data.shops.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <div class="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <StoreIcon class="text-primary size-6" />
        </div>
        <h2 class="mt-4 text-xl font-semibold">You haven't created a shop yet</h2>
        <p class="text-muted-foreground mt-1 max-w-sm text-center text-sm">
          Set up your first shop to start managing products, orders, and customers.
        </p>
        <a href="/shops/setup" class={buttonVariants({ class: "mt-6" })}>
          <PlusIcon class="size-4" />
          Create Your First Shop
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {#each data.shops as shop (shop.id)}
          <a
            href={`/${shop.slug}`}
            class="group hover:border-primary/50 block cursor-pointer rounded-xl transition-all hover:-translate-y-px hover:shadow-md"
          >
            <Card.Root class="h-full">
              <Card.Content class="flex items-start gap-3 p-4">
                <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                  <StoreIcon class="text-primary size-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg font-semibold">{shop.name}</h3>
                  <p class="text-muted-foreground text-sm">/{shop.slug}</p>
                </div>
              </Card.Content>
            </Card.Root>
          </a>
        {/each}

        <a href="/shops/setup" class="block">
          <Card.Root
            class="group hover:border-primary/50 cursor-pointer border-dashed transition-all hover:-translate-y-px hover:shadow-md"
          >
            <Card.Content class="flex flex-col items-center justify-center gap-3 py-8">
              <div class="bg-muted flex size-10 items-center justify-center rounded-full">
                <PlusIcon class="text-muted-foreground size-5" />
              </div>
              <p class="text-sm font-medium">Create New Shop</p>
            </Card.Content>
          </Card.Root>
        </a>
      </div>
    {/if}
  </div>
</div>
