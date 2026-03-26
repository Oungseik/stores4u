<script lang="ts">
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  import type { CategoryItem } from "../columns";

  type Props = {
    category: CategoryItem;
    slug: string;
    onEdit: (category: CategoryItem) => void;
    onDelete: (category: CategoryItem) => void;
  };

  const { category, slug, onEdit, onDelete }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
    onclick={(e) => e.stopPropagation()}
  >
    <MoreVerticalIcon class="size-4" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={() => onEdit(category)}>
      <PencilIcon class="mr-2 size-4" />
      Edit
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={() => onDelete(category)}>
      <Trash2Icon class="mr-2 size-4" />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
