<script lang="ts">
  import * as Dialog from "@repo/ui/dialog";

  import CategoryForm from "$lib/components/forms/CategoryForm.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
  }

  let { open, onClose, slug }: Props = $props();

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Add New Category</Dialog.Title>
      <Dialog.Description>Create a new category to organize your products</Dialog.Description>
    </Dialog.Header>

    <div class="px-3 sm:px-4">
      <CategoryForm {slug} onSuccess={onClose} onCancel={onClose} />
    </div>
  </Dialog.Content>
</Dialog.Root>
