<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import * as Card from "@repo/ui/card";

  const mockNotifications = [
    {
      id: 1,
      type: "low_stock",
      title: "Coffee Beans",
      description: "Running low (5 left)",
      productId: 1,
    },
    { id: 2, type: "out_of_stock", title: "Milk", description: "Out of stock", productId: 2 },
    { id: 3, type: "low_stock", title: "Sugar", description: "3 items remaining", productId: 3 },
  ];
</script>

<section class="overflow-y-auto p-4">
  <div class="mb-3">
    <h2 class="text-lg font-semibold">Notifications</h2>
  </div>

  <Card.Root class="overflow-hidden p-0">
    <Card.Content class="p-0">
      {#each mockNotifications as notification}
        <button
          type="button"
          class="hover:bg-muted/50 flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0"
        >
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangleIcon class="size-4 text-amber-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{notification.title}</p>
            <p class="text-muted-foreground text-xs">{notification.description}</p>
          </div>
          <ChevronRightIcon class="text-muted-foreground size-4" />
        </button>
      {/each}
    </Card.Content>
  </Card.Root>
</section>
