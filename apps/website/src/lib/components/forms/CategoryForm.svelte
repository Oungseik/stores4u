<script lang="ts">
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
        toast.success("Category created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create category");
      },
    }),
  );

  const updateCategory = createMutation(() =>
    orpc.categories.update.mutationOptions({
      onSuccess: () => {
        toast.success("Category updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update category");
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
        z.string().min(1, "Name is required").max(255).safeParse(value).error?.issues.at(0)
          ?.message,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>Category Name *</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter category name"
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
        <Label for={field.name}>Description</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter category description (optional)"
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
      <Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
    {/if}
    <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
      {#if createCategory.isPending || updateCategory.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        {isEditMode ? "Updating..." : "Creating..."}
      {:else}
        {isEditMode ? "Update Category" : "Create Category"}
      {/if}
    </Button>
  </div>
</form>
