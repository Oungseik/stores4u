<script lang="ts">
  import DownloadIcon from "@lucide/svelte/icons/download";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    slug: string;
    status: string;
    onDelete: (id: string) => void;
    onDownload: (id: string) => void;
  };

  const { id, slug, status, onDelete, onDownload }: Props = $props();

  const canEdit = $derived(status === "PROCESSED" || status === "REVIEWED");
  const canDownload = $derived(status !== "PROCESSING");
  const canDelete = $derived(status === "UPLOADED" || status === "FAILED");

  function handleDelete() {
    confirmDelete({
      title: "Delete Invoice File",
      description: "Are you sure you want to delete this invoice file? This action cannot be undone.",
      onConfirm: async () => {
        onDelete(id);
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
    {#if canEdit}
      <DropdownMenu.Item>
        {#snippet child()}
          <a
            class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
            href={`/${slug}/admin/purchases/review?fileId=${id}`}
          >
            <PencilIcon class="mr-2 size-4" />
            Edit
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/if}
    {#if canDownload}
      <DropdownMenu.Item onclick={() => onDownload(id)}>
        <DownloadIcon class="size-4" />
        Download
      </DropdownMenu.Item>
    {/if}
    {#if canDelete}
      <DropdownMenu.Separator />
      <DropdownMenu.Item class="text-red-600" onclick={handleDelete}>
        <Trash2Icon class="size-4" />
        Delete
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
