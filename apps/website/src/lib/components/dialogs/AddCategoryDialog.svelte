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
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Add New Category</Dialog.Title>
      <Dialog.Description>Create a new category to organize your products</Dialog.Description>
    </Dialog.Header>

    <CategoryForm {slug} onSuccess={onClose} onCancel={onClose} />
  </Dialog.Content>
</Dialog.Root>
