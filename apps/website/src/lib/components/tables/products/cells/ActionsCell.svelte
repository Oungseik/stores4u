<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    productName: string;
    currentStock: number;
    lastCostCents: number | null;
    onDelete?: (id: string) => void;
    onAdjustStock?: (id: string, name: string, stock: number, lastCostCents: number | null) => void;
  };

  const { id, productName, currentStock, lastCostCents, onDelete, onAdjustStock }: Props = $props();

  function handleDelete() {
    confirmDelete({
      title: msg.ui_delete_product(),
      description: msg.ui_are_you_sure_you_want_to_delete_this_product_this_actio(),
      onConfirm: async () => {
        onDelete?.(id);
      },
    });
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
    onclick={(e) => e.stopPropagation()}
  >
    <MoreVerticalIcon class="size-4" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item>
      <a href={localizePath(`/products/${id}/edit`)} class="flex items-center gap-2">
        <PencilIcon class="size-4" />
        {msg.ui_edit()}
      </a>
    </DropdownMenu.Item>
    <DropdownMenu.Item
      onclick={() => onAdjustStock?.(id, productName, currentStock, lastCostCents)}
      disabled={!onAdjustStock}
    >
      <ArrowUpDownIcon class="size-4" />
      {msg.ui_adjust_stock()}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDelete} disabled={!onDelete}>
      <Trash2Icon class="size-4" />
      {msg.ui_delete()}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
