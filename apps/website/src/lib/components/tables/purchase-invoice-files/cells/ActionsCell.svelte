<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";

  type Props = {
    id: string;
    status: string;
    isProcessing: boolean;
    onProcess: (id: string) => void;
    onDelete: (id: string) => void;
  };

  const { id, status, isProcessing, onProcess, onDelete }: Props = $props();

  const canDelete = $derived(status === "UPLOADED" || status === "FAILED" || status === "REJECTED");

  function handleDelete() {
    confirmDelete({
      title: msg.ui_delete_invoice_file(),
      description: msg.ui_are_you_sure_you_want_to_delete_this_invoice_file_this_(),
      onConfirm: async () => {
        onDelete(id);
      },
    });
  }
</script>

{#if status === "PROCESSING" || isProcessing}
  <div class="text-muted-foreground flex items-center gap-2">
    <Loader2Icon class="size-4 animate-spin" />
    <span class="text-sm">{msg.ui_processing()}</span>
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
          {msg.ui_process()}
        </DropdownMenu.Item>
      {:else if status === "FAILED"}
        <DropdownMenu.Item onclick={() => onProcess(id)}>
          <PlayIcon class="size-4" />
          {msg.ui_retry()}
        </DropdownMenu.Item>
      {:else if status === "PROCESSED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={localizePath(`/purchases/invoices/${id}`)}
            >
              <SearchIcon class="size-4" />
              {msg.ui_review()}
            </a>
          {/snippet}
        </DropdownMenu.Item>
      {:else if status === "REVIEWED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={localizePath(`/purchases/invoices/${id}`)}
            >
              <SearchIcon class="size-4" />
              {msg.ui_view_details()}
            </a>
          {/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={localizePath(`/purchases/invoices/${id}/edit`)}
            >
              <PencilIcon class="size-4" />
              {msg.ui_edit()}
            </a>
          {/snippet}
        </DropdownMenu.Item>
      {:else if status === "REJECTED"}
        <DropdownMenu.Item>
          {#snippet child()}
            <a
              class={buttonVariants({ variant: "ghost", class: "w-full justify-start" })}
              href={localizePath(`/purchases/invoices/${id}/review`)}
            >
              <SearchIcon class="size-4" />
              {msg.ui_view_details()}
            </a>
          {/snippet}
        </DropdownMenu.Item>
      {/if}
      {#if canDelete}
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="text-red-600" onclick={handleDelete}>
          <Trash2Icon class="size-4" />
          {msg.ui_delete()}
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
