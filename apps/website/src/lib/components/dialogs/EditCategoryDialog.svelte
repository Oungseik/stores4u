<script lang="ts">
  import * as Dialog from "@repo/ui/dialog";

  import CategoryForm from "$lib/components/forms/CategoryForm.svelte";
  import type { CategoryItem } from "$lib/components/tables/categories/columns";

  interface Props {
    open: boolean;
    onClose: () => void;
    category: CategoryItem;
  }

  let { open, onClose, category }: Props = $props();

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Edit Category</Dialog.Title>
      <Dialog.Description>Update category information</Dialog.Description>
    </Dialog.Header>

    <div class="px-3 sm:px-4">
      {#key category.id}
        <CategoryForm
          initialData={{
            id: category.id,
            name: category.name,
            description: category.description,
          }}
          onSuccess={onClose}
          onCancel={onClose}
        />
      {/key}
    </div>
  </Dialog.Content>
</Dialog.Root>
