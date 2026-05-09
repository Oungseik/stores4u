<script lang="ts">
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    slug: string;
    productName: string;
    currentStock: number;
    onDelete?: (id: string) => void;
    onAdjustStock?: (id: string, name: string, stock: number) => void;
  };

  const { id, slug, productName, currentStock, onDelete, onAdjustStock }: Props = $props();

  function handleDelete() {
    confirmDelete({
      title: "Delete Product",
      description: "Are you sure you want to delete this product? This action cannot be undone.",
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
      <a href={`/${slug}/products/${id}/edit`} class="flex items-center gap-2">
        <PencilIcon class="size-4" />
        Edit
      </a>
    </DropdownMenu.Item>
    <DropdownMenu.Item
      onclick={() => onAdjustStock?.(id, productName, currentStock)}
      disabled={!onAdjustStock}
    >
      <ArrowUpDownIcon class="size-4" />
      Adjust Stock
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDelete} disabled={!onDelete}>
      <Trash2Icon class="size-4" />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
