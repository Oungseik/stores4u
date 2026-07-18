<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import * as Dialog from "@repo/ui/dialog";

  import CategoryForm from "$lib/components/forms/CategoryForm.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>{msg.ui_add_new_category()}</Dialog.Title>
      <Dialog.Description
        >{msg.ui_create_a_new_category_to_organize_your_products()}</Dialog.Description
      >
    </Dialog.Header>

    <div class="px-3 sm:px-4">
      <CategoryForm onSuccess={onClose} onCancel={onClose} />
    </div>
  </Dialog.Content>
</Dialog.Root>
