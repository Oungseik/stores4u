<script lang="ts">
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    slug: string;
    onDelete?: (id: string) => void;
  };

  const { id, slug, onDelete }: Props = $props();

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
      {#snippet child()}
        <a
          class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
          href={`/${slug}/admin/products/${id}/edit`}
        >
          <PencilIcon class="size-4" />
          Edit
        </a>
      {/snippet}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-red-600" onclick={handleDelete} disabled={!onDelete}>
      <Trash2Icon class="size-4" />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
