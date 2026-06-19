<script lang="ts">
  import EyeIcon from "@lucide/svelte/icons/eye";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  import { goto } from "$app/navigation";

  type Props = {
    id: string;
    onView?: (id: string) => void;
    onDelete?: (id: string) => void;
  };

  const { id, onView, onDelete }: Props = $props();

  function handleDelete() {
    confirmDelete({
      title: "Delete Purchase Invoice",
      description: "Are you sure you want to delete this invoice? This action cannot be undone.",
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
    <DropdownMenu.Item onclick={() => onView?.(id)}>
      <EyeIcon class="mr-2 size-4" />
      View Details
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => goto(`/purchases/invoices/${id}/edit`)}>
      <PencilIcon class="size-4" />
      Edit
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDelete} disabled={!onDelete}>
      <Trash2Icon class="size-4" />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
