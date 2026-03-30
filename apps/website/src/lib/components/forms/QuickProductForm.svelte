<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Select from "@repo/ui/select";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { orpc } from "$lib/orpc_client";

  interface Props {
    slug: string;
    initialName?: string;
    initialPriceCents?: number;
    onCreated?: (product: { id: string; name: string; sku: string }) => void;
    onCancel?: () => void;
  }

  let { slug, initialName = "", initialPriceCents = 0, onCreated, onCancel }: Props = $props();

  const queryClient = useQueryClient();

  const uoms = ["piece", "kg", "g", "L", "mL", "pack", "box", "dozen", "set", "pair"] as const;

  let selectedUom = $state("piece");

  const createProduct = createMutation(() =>
    orpc.products.create.mutationOptions({
      onSuccess: (result) => {
        toast.success("Product created");
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        onCreated?.({ id: result.id, name: result.name, sku: result.sku });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create product");
      },
    })
  );

  const form = createForm(() => ({
    defaultValues: {
      name: initialName,
      sku: "",
      price: initialPriceCents > 0 ? (initialPriceCents / 100).toFixed(2) : "",
    },
    onSubmit: async ({ value }) => {
      const priceCents = Math.round(Number.parseFloat(value.price || "0") * 100);
      createProduct.mutate({
        slug,
        name: value.name,
        sku: value.sku,
        priceCents,
        uom: selectedUom,
      });
    },
  }));
</script>

<form
  class="space-y-4"
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
        <Label for={field.name}>Name *</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="Product name"
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <form.Field
    name="sku"
    validators={{
      onChange: ({ value }) =>
        z.string().min(1, "SKU is required").max(100).safeParse(value).error?.issues.at(0)?.message,
    }}
  >
    {#snippet children(field)}
      <div class="space-y-2">
        <Label for={field.name}>SKU *</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          type="text"
          onblur={field.handleBlur}
          onchange={(e) => field.handleChange(e.currentTarget.value)}
          placeholder="e.g., PROD-001"
        />
        {#if field.state.meta.errors.length}
          <p class="text-sm text-red-500">{field.state.meta.errors}</p>
        {/if}
      </div>
    {/snippet}
  </form.Field>

  <div class="grid grid-cols-2 gap-4">
    <form.Field
      name="price"
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Price is required";
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) return "Must be > 0";
          return undefined;
        },
      }}
    >
      {#snippet children(field)}
        <div class="space-y-2">
          <Label for={field.name}>Price *</Label>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            type="number"
            step="0.01"
            min="0.01"
            onblur={field.handleBlur}
            onchange={(e) => field.handleChange(e.currentTarget.value)}
            placeholder="0.00"
          />
          {#if field.state.meta.errors.length}
            <p class="text-sm text-red-500">{field.state.meta.errors}</p>
          {/if}
        </div>
      {/snippet}
    </form.Field>

    <div class="space-y-2">
      <Label>UOM *</Label>
      <Select.Root type="single" bind:value={selectedUom}>
        <Select.Trigger class="w-full">{selectedUom}</Select.Trigger>
        <Select.Content>
          {#each uoms as uom}
            <Select.Item value={uom}>{uom}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  <div class="flex justify-end gap-2 pt-2">
    {#if onCancel}
      <Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
    {/if}
    <Button type="submit" disabled={createProduct.isPending}>
      {#if createProduct.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        Creating...
      {:else}
        Create Product
      {/if}
    </Button>
  </div>
</form>
