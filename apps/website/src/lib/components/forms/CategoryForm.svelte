<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { orpc } from "$lib/orpc_client";

  interface CategoryInitialData {
    id: string;
    name: string;
    description: string | null;
  }

  interface Props {
    initialData?: CategoryInitialData;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { initialData, onSuccess, onCancel }: Props = $props();

  const queryClient = useQueryClient();

  const createCategory = createMutation(() =>
    orpc.categories.create.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_category_created_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.categories.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_create_category"));
      },
    }),
  );

  const updateCategory = createMutation(() =>
    orpc.categories.update.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_category_updated_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.categories.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_update_category"));
      },
    }),
  );

  // svelte-ignore state_referenced_locally
  const isEditMode = !!initialData;

  // svelte-ignore state_referenced_locally
  const defaultValues = {
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
  };

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isEditMode && initialData) {
        updateCategory.mutate({
          id: initialData.id,
          name: value.name,
          description: value.description || null,
        });
      } else {
        createCategory.mutate({
          name: value.name,
          description: value.description || undefined,
        });
      }
    },
  }));

  export function resetForm() {
    form.reset();
  }
</script>

<form
  class="space-y-4 py-4"
  onsubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }}
>
  <form.Field
    name="name"
    validators={{
      onChange: ({ value }) =>
        z.string().min(1, msg.ui_name_is_required()).max(255).safeParse(value).error?.issues.at(0)
          ?.message,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_category_name()}</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder={msg.ui_enter_category_name()}
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field
    name="description"
    validators={{
      onChange: ({ value }) =>
        value ? z.string().max(2000).safeParse(value).error?.issues.at(0)?.message : undefined,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>{msg.ui_description()}</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder={msg.ui_enter_category_description_optional()}
          rows={3}
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <div class="flex justify-end gap-2">
    {#if onCancel}
      <Button type="button" variant="outline" onclick={onCancel}>{msg.ui_cancel()}</Button>
    {/if}
    <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
      {#if createCategory.isPending || updateCategory.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        {isEditMode ? msg.ui_updating() : msg.ui_creating()}
      {:else}
        {isEditMode ? msg.ui_update_category() : msg.ui_create_category()}
      {/if}
    </Button>
  </div>
</form>
