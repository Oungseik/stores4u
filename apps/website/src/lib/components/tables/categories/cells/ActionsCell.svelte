<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import ListPlusIcon from "@lucide/svelte/icons/list-plus";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  import type { CategoryItem } from "../columns";

  type Props = {
    category: CategoryItem;
    onEdit: (category: CategoryItem) => void;
    onDelete: (category: CategoryItem) => void;
    onManageProducts: (category: CategoryItem) => void;
  };

  const { category, onEdit, onDelete, onManageProducts }: Props = $props();

  function handleDelete() {
    confirmDelete({
      title: msg.ui_delete_category(),
      description: msg.confirm_delete_named({ name: category.name }),
      onConfirm: async () => {
        onDelete(category);
      },
    });
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "ghost" })}
    onclick={(e) => e.stopPropagation()}
  >
    <MoreVerticalIcon class="size-4" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="min-w-max">
    <DropdownMenu.Item onclick={() => onManageProducts(category)}>
      <ListPlusIcon class="size-4" />
      {msg.ui_manage_products()}
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => onEdit(category)}>
      <PencilIcon class="size-4" />
      {msg.ui_edit()}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDelete}>
      <Trash2Icon class="size-4" />
      {msg.ui_delete()}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
