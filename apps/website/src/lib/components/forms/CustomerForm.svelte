<script lang="ts">
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { type DetailedValue, PhoneInput } from "@repo/ui/phone-input";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { orpc } from "$lib/orpc_client";
  import type { CustomerType } from "$lib/server/db";

  // Shape of a customer row as returned by create/update, narrowed to the fields callers consume.
  export type CreatedCustomer = {
    id: string;
    name: string;
    customerType: CustomerType;
    contactName: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    address: string | null;
    taxId: string | null;
    paymentTerms: string | null;
    notes: string | null;
  };

  type CustomerInitialData = {
    id: string;
    name: string;
    customerType: CustomerType;
    contactName: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    address: string | null;
    taxId: string | null;
    paymentTerms: string | null;
    notes: string | null;
  };

  interface Props {
    initialData?: CustomerInitialData;
    onSuccess?: (customer: CreatedCustomer) => void;
  }

  let { initialData, onSuccess }: Props = $props();

  // Authoritative E.164 source for phone fields. The form submits these, never the
  // input's display text (svelte-tel-input renders national format, dial code stripped).
  let phoneDetailed: DetailedValue | null = $state(null);
  let phone2Detailed: DetailedValue | null = $state(null);

  const queryClient = useQueryClient();

  const createCustomer = createMutation(() =>
    orpc.customers.create.mutationOptions({
      onSuccess: (created) => {
        toast.success("Customer created successfully");
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
        onSuccess?.(created);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create customer");
      },
    }),
  );

  const updateCustomer = createMutation(() =>
    orpc.customers.update.mutationOptions({
      onSuccess: (updated) => {
        toast.success("Customer updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.customers.get.key() });
        onSuccess?.(updated);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update customer");
      },
    }),
  );

  // svelte-ignore state_referenced_locally
  const isEditMode = !!initialData;

  // svelte-ignore state_referenced_locally
  const defaultValues = {
    name: initialData?.name ?? "",
    customerType: (initialData?.customerType ?? "RETAIL") as CustomerType,
    contactName: initialData?.contactName ?? "",
    phone: initialData?.phone ?? "",
    phone2: initialData?.phone2 ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
    taxId: initialData?.taxId ?? "",
    paymentTerms: initialData?.paymentTerms ?? "",
    notes: initialData?.notes ?? "",
  };

  const form = createForm(() => ({
    defaultValues,
    onSubmit: async ({ value }) => {
      const phone = phoneDetailed?.e164 ?? null;
      const phone2 = phone2Detailed?.e164 ?? null;
      if (initialData) {
        updateCustomer.mutate({
          id: initialData.id,
          name: value.name,
          customerType: value.customerType,
          contactName: value.contactName || null,
          phone,
          phone2,
          email: value.email || null,
          address: value.address || null,
          taxId: value.taxId || null,
          paymentTerms: value.paymentTerms || null,
          notes: value.notes || null,
        });
      } else {
        createCustomer.mutate({
          name: value.name,
          customerType: value.customerType,
          contactName: value.contactName || undefined,
          phone: phone || undefined,
          phone2: phone2 || undefined,
          email: value.email || undefined,
          address: value.address || undefined,
          taxId: value.taxId || undefined,
          paymentTerms: value.paymentTerms || undefined,
          notes: value.notes || undefined,
        });
      }
    },
  }));

  export function resetForm() {
    form.reset();
  }

  export function submit() {
    form.handleSubmit();
  }

  export function getIsPending() {
    return createCustomer.isPending || updateCustomer.isPending;
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
        <Label for={field.name}>Customer Name *</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Enter customer name"
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field name="customerType">
    {#snippet children(field)}
      <div class="space-y-2">
        <Label>Customer Type</Label>
        <div class="flex gap-2">
          <Button
            type="button"
            variant={field.state.value === "RETAIL" ? "default" : "outline"}
            onclick={() => field.handleChange("RETAIL")}
          >
            Retail
          </Button>
          <Button
            type="button"
            variant={field.state.value === "WHOLESALE" ? "default" : "outline"}
            onclick={() => field.handleChange("WHOLESALE")}
          >
            Wholesale
          </Button>
        </div>
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
            value={field.state.value}
            bind:detailedValue={phoneDetailed}
            name={field.name}
            placeholder="+1 555-0000"
            onValueChange={(value) => field.handleChange(value)}
          />
          {#if field.state.meta.errors.length}
            <p class="text-sm text-red-500">{field.state.meta.errors}</p>
          {/if}
        </div>
      {/snippet}
    </form.Field>

    <form.Field
      name="phone2"
      validators={{
        onChange: ({ value }) =>
          value ? z.string().max(50).safeParse(value).error?.issues.at(0)?.message : undefined,
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Phone 2</Label>
          <PhoneInput
            value={field.state.value}
            bind:detailedValue={phone2Detailed}
            name={field.name}
            placeholder="+1 555-0000"
            onValueChange={(value) => field.handleChange(value)}
          />
          {#if field.state.meta.errors.length}
            <p class="text-sm text-red-500">{field.state.meta.errors}</p>
          {/if}
        </div>
      {/snippet}
    </form.Field>
  </div>

  <div class="grid grid-cols-2 gap-4">
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

    <form.Field
      name="taxId"
      validators={{
        onChange: ({ value }) =>
          value ? z.string().max(255).safeParse(value).error?.issues.at(0)?.message : undefined,
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Tax ID</Label>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            type="text"
            onblur={field.handleBlur}
            onchange={(e) => field.handleChange(e.currentTarget.value)}
            placeholder="Tax ID / VAT No."
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

  <form.Field
    name="notes"
    validators={{
      onChange: ({ value }) =>
        value ? z.string().max(2000).safeParse(value).error?.issues.at(0)?.message : undefined,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>Notes</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Customer notes (preferences, credit history, etc.)"
          rows={3}
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>
</form>
