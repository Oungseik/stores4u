<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { PhoneInput } from "@repo/ui/phone-input";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { orpc } from "$lib/orpc_client";

  type SupplierInitialData =
    | {
        action: "create";
        name?: string;
        contactName?: string | null;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        paymentTerms?: string | null;
      }
    | {
        action: "update";
        id: string;
        name: string;
        contactName: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        paymentTerms: string | null;
      };

  interface Props {
    slug: string;
    initialData?: SupplierInitialData;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { slug, initialData, onSuccess, onCancel }: Props = $props();

  const queryClient = useQueryClient();

  const createSupplier = createMutation(() =>
    orpc.suppliers.create.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create supplier");
      },
    })
  );

  const updateSupplier = createMutation(() =>
    orpc.suppliers.update.mutationOptions({
      onSuccess: () => {
        toast.success("Supplier updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update supplier");
      },
    })
  );

  // svelte-ignore state_referenced_locally
  const isEditMode = initialData?.action === "update";

  // svelte-ignore state_referenced_locally
  const defaultValues = {
    name: initialData?.name ?? "",
    contactName: initialData?.contactName ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
    paymentTerms: initialData?.paymentTerms ?? "",
  };

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (initialData?.action === "update") {
        updateSupplier.mutate({
          slug,
          id: initialData.id,
          name: value.name,
          contactName: value.contactName || null,
          phone: value.phone || null,
          email: value.email || null,
          address: value.address || null,
          paymentTerms: value.paymentTerms || null,
        });
      } else {
        createSupplier.mutate({
          slug,
          name: value.name,
          contactName: value.contactName || undefined,
          phone: value.phone || undefined,
          email: value.email || undefined,
          address: value.address || undefined,
          paymentTerms: value.paymentTerms || undefined,
        });
      }
    },
  }));

  export function resetForm() {
    form.reset();
  }
</script>

<form
  class="space-y-4 pt-4"
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
        <Label for={field.name}>Supplier Name *</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter supplier name"
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field
    name="contactName"
    validators={{
      onChange: ({ value }) =>
        value ? z.string().max(255).safeParse(value).error?.issues.at(0)?.message : undefined,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>Contact Person</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter contact name"
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <div class="grid grid-cols-2 gap-4">
    <form.Field
      name="phone"
      validators={{
        onChange: ({ value }) =>
          value ? z.string().max(50).safeParse(value).error?.issues.at(0)?.message : undefined,
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Phone</Label>
          <PhoneInput
            bind:value={field.state.value}
            name={field.name}
            placeholder="+1 555-0000"
            onchange={(e) => {
              field.handleChange(e.currentTarget.value);
            }}
          />
          {#if field.state.meta.errors.length}
            <p class="text-sm text-red-500">{field.state.meta.errors}</p>
          {/if}
        </div>
      {/snippet}
    </form.Field>

    <form.Field
      name="email"
      validators={{
        onChange: ({ value }) => {
          if (!value) return undefined;
          const emailSchema = z.email();
          return emailSchema.safeParse(value).error?.issues.at(0)?.message;
        },
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Email</Label>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            type="email"
            onblur={field.handleBlur}
            onchange={(e) => field.handleChange(e.currentTarget.value)}
            placeholder="email@example.com"
          />
          {#if field.state.meta.errors.length}
            <p class="text-sm text-red-500">{field.state.meta.errors}</p>
          {/if}
        </div>
      {/snippet}
    </form.Field>
  </div>

  <form.Field
    name="address"
    validators={{
      onChange: ({ value }) =>
        value ? z.string().max(500).safeParse(value).error?.issues.at(0)?.message : undefined,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>Address</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter full address"
          rows={3}
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field
    name="paymentTerms"
    validators={{
      onChange: ({ value }) =>
        value ? z.string().max(255).safeParse(value).error?.issues.at(0)?.message : undefined,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>Payment Terms</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Net 30"
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
    <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
      {#if createSupplier.isPending || updateSupplier.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        {isEditMode ? "Updating..." : "Creating..."}
      {:else}
        {isEditMode ? "Update Supplier" : "Create Supplier"}
      {/if}
    </Button>
  </div>
</form>
