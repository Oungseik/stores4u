<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { NumberInput } from "@repo/ui/number-input";

  import { formatPrice } from "$lib/utils";

  export type InvoiceItem = {
    id: string;
    productName: string;
    qty: number;
    unitCost: number;
  };

  let { items = $bindable([]) }: { items: InvoiceItem[] } = $props();

  let editingItemId = $state<string | null>(null);

  const lineTotalsCents = $derived(items.map((item) => Math.round(item.qty * item.unitCost * 100)));

  function addItem() {
    const newItemId = `item-${Date.now()}`;
    items = [
      ...items,
      {
        id: newItemId,
        productName: "",
        qty: 1,
        unitCost: 0,
      },
    ];
    editingItemId = newItemId;
  }

  function removeItem(itemId: string) {
    items = items.filter((i) => i.id !== itemId);
  }
</script>

<Card.Root class="pb-0">
  <Card.Header class="flex flex-row items-center justify-between">
    <Card.Title class="flex items-center gap-2">
      <PackageIcon class="size-4" />
      Items ({items.length})
    </Card.Title>
    <Button variant="outline" size="sm" onclick={addItem}>
      <PlusIcon class="size-4" />
      Add Item
    </Button>
  </Card.Header>
  <Card.Content class="p-0">
    {#if items.length === 0}
      <div class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
        <PackageIcon class="size-10 opacity-50" />
        <p class="text-sm">No items yet</p>
        <Button variant="outline" size="sm" onclick={addItem}>
          <PlusIcon class="size-4" />
          Add first item
        </Button>
      </div>
    {:else}
      <div class="divide-y">
        {#each items as item, index (item.id)}
          {@const isEditing = editingItemId === item.id}
          <div class="hover:bg-muted/30 transition-colors {isEditing ? 'bg-muted/50' : ''}">
            {#if isEditing}
              <div class="flex flex-wrap items-center gap-2 p-3">
                <Input bind:value={item.productName} placeholder="Product" class="min-w-0 flex-1" />
                <NumberInput bind:value={item.qty} class="w-16 text-center" fraction={0} min={0} />
                <NumberInput
                  bind:value={item.unitCost}
                  class="w-24 text-right"
                  fraction={2}
                  min={0}
                />
                <span class="font-medium tabular-nums">
                  {formatPrice(lineTotalsCents[index])}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                  onclick={() => (editingItemId = null)}
                >
                  <CheckIcon class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-red-500 hover:text-red-700"
                  onclick={() => {
                    removeItem(item.id);
                    editingItemId = null;
                  }}
                >
                  <Trash2Icon class="size-3.5" />
                </Button>
              </div>
            {:else}
              <div class="flex items-center gap-2 p-3">
                <div class="min-w-0 flex-1 truncate font-medium">
                  {#if item.productName}
                    {item.productName}
                  {:else}
                    <span class="text-muted-foreground italic">Unnamed</span>
                  {/if}
                </div>
                <span class="text-muted-foreground text-sm tabular-nums">
                  {item.qty}×{formatPrice(Math.round(item.unitCost * 100))}
                  =
                </span>
                <span class="font-medium tabular-nums">
                  {formatPrice(lineTotalsCents[index])}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7"
                  onclick={() => (editingItemId = item.id)}
                >
                  <PencilIcon class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7 text-red-500 hover:text-red-700"
                  onclick={() => removeItem(item.id)}
                >
                  <Trash2Icon class="size-3.5" />
                </Button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
