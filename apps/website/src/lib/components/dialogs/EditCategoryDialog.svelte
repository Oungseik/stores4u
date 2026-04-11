<script lang="ts">
  import * as Dialog from "@repo/ui/dialog";

  import CategoryForm from "$lib/components/forms/CategoryForm.svelte";
  import type { CategoryItem } from "$lib/components/tables/categories/columns";

  interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    category: CategoryItem;
  }

  let { open, onClose, slug, category }: Props = $props();

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Edit Category</Dialog.Title>
      <Dialog.Description>Update category information</Dialog.Description>
    </Dialog.Header>

    {#key category.id}
      <CategoryForm
        {slug}
        initialData={{
          id: category.id,
          name: category.name,
          description: category.description,
        }}
        onSuccess={onClose}
        onCancel={onClose}
      />
    {/key}
  </Dialog.Content>
</Dialog.Root>
