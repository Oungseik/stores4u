<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { toast } from "svelte-sonner";

  import { createShop } from "$lib/remote/shops/create_shop.remote";
  import { shopCreateSchema } from "$lib/types/shop";
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
  <div class="flex w-full max-w-lg flex-col gap-6">
    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Create Your Shop</Card.Title>
        <Card.Description>Pick a name and URL for your shop</Card.Description>
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
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="shop-name">Shop Name *</Label>
              <Input
                id="shop-name"
                {...createShop.fields.name.as("text")}
                placeholder="My Awesome Shop"
              />
              {#each createShop.fields.name.issues() as issue}
                <p class="text-sm text-red-500">{issue.message}</p>
              {/each}
            </div>

            <div class="space-y-2">
              <Label for="shop-slug">Slug *</Label>
              <Input
                id="shop-slug"
                {...createShop.fields.slug.as("text")}
                placeholder="my-awesome-shop"
              />
              <p class="text-xs text-muted-foreground">Used in your shop URL</p>
              {#each createShop.fields.slug.issues() as issue}
                <p class="text-sm text-red-500">{issue.message}</p>
              {/each}
            </div>
          </div>

          <div class="pt-4">
            <Button disabled={!!createShop.pending} type="submit" class="w-full">
              {#if createShop.pending}
                <Loader2Icon class="animate-spin" />
              {:else}
                Create Shop
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
