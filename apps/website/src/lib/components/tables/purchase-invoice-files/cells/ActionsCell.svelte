<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    slug: string;
    status: string;
    isProcessing: boolean;
    onProcess: (id: string) => void;
    onDelete: (id: string) => void;
  };

  const { id, slug, status, isProcessing, onProcess, onDelete }: Props = $props();

  const canDelete = $derived(status === "UPLOADED" || status === "FAILED" || status === "REJECTED");

  function handleDelete() {
    confirmDelete({
      title: "Delete Invoice File",
      description:
        "Are you sure you want to delete this invoice file? This action cannot be undone.",
      onConfirm: async () => {
        onDelete(id);
      },
    });
  }
</script>

{#if status === "PROCESSING" || isProcessing}
  <div class="text-muted-foreground flex items-center gap-2">
    <Loader2Icon class="size-4 animate-spin" />
    <span class="text-sm">Processing...</span>
  </div>
{:else}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
      onclick={(e) => e.stopPropagation()}
    >
      <MoreVerticalIcon class="size-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#if status === "UPLOADED"}
        <DropdownMenu.Item onclick={() => onProcess(id)}>
          <PlayIcon class="size-4" />
          Process
        </DropdownMenu.Item>
      {:else if status === "FAILED"}
        <DropdownMenu.Item onclick={() => onProcess(id)}>
          <PlayIcon class="size-4" />
          Retry
        </DropdownMenu.Item>
      {:else if status === "PROCESSED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={`/${slug}/purchases/invoices/${id}`}
            >
              <SearchIcon class="size-4" />
              Review
            </a>
          {/snippet}
        </DropdownMenu.Item>
      {:else if status === "REVIEWED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={`/${slug}/purchases/invoices/${id}`}
            >
              <SearchIcon class="size-4" />
              View Details
            </a>
          {/snippet}
        </DropdownMenu.Item>
      {:else if status === "REJECTED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={`/${slug}/purchases/invoices/${id}/review`}
            >
              <SearchIcon class="size-4" />
              View Details
            </a>
          {/snippet}
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
{/if}
