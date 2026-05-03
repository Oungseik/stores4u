<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { toast } from "svelte-sonner";

  import { createShop } from "$lib/remote/shops/create_shop.remote";
  import { shopCreateSchema } from "$lib/types/shop";
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
  <div class="w-full max-w-lg">
    <a
      href="/"
      class="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeftIcon class="size-4" />
      Back to shops
    </a>

    <Card.Root>
      <Card.Header>
        <Card.Title class="text-2xl font-semibold tracking-tight">Create a new shop</Card.Title>
        <Card.Description>
          Choose a name and unique URL for your shop. You can update these later in settings.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          {...createShop.preflight(shopCreateSchema).enhance(async ({ submit }) => {
            if (await submit()) {
              const result = createShop.result;
              if (result?.success) {
                return void toast.success("Shop created successfully!");
              }
              toast.error(result?.message || "Failed to create shop.");
            }
          })}
          class="space-y-6"
        >
          <div class="space-y-2">
            <Label for="shop-name">Shop Name *</Label>
            <Input
              id="shop-name"
              {...createShop.fields.name.as("text")}
              placeholder="My Awesome Shop"
            />
            {#each createShop.fields.name.issues() as issue}
              <p class="text-sm text-destructive">{issue.message}</p>
            {/each}
          </div>

          <div class="space-y-2">
            <Label for="shop-slug">Slug *</Label>
            <div class="relative">
              <span
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground"
              >
                /
              </span>
              <Input
                id="shop-slug"
                class="pl-7"
                {...createShop.fields.slug.as("text")}
                placeholder="my-awesome-shop"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Your shop will be accessible at /shops/your-slug
            </p>
            {#each createShop.fields.slug.issues() as issue}
              <p class="text-sm text-destructive">{issue.message}</p>
            {/each}
          </div>

          <Button disabled={!!createShop.pending} type="submit" class="w-full">
            {#if createShop.pending}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Creating...
            {:else}
              Create Shop
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
