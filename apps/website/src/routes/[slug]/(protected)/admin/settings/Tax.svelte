<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PercentIcon from "@lucide/svelte/icons/percent";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Switch } from "@repo/ui/switch";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  type Shop = PageProps["data"];

  interface Props {
    shop: Shop;
  }

  let { shop }: Props = $props();

  const taxSettingsQuery = createQuery(() =>
    orpc.tax.get.queryOptions({
      input: { slug: shop.slug },
    })
  );

  const updateTaxMutation = createMutation(() =>
    orpc.tax.update.mutationOptions({
      onSuccess: async () => {
        toast.success("VAT settings updated");
        await taxSettingsQuery.refetch();
        taxForm.reset();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to update VAT settings");
      },
    })
  );

  const defaultSettings = {
    enabled: true,
    rate: 0,
    name: "VAT",
  };

  const taxForm = createForm(() => ({
    defaultValues: taxSettingsQuery.data?.settings ?? defaultSettings,
    onSubmit: async ({ value }) => {
      await updateTaxMutation.mutateAsync({
        slug: shop.slug,
        ...value,
      });
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <PercentIcon class="size-5" />
      VAT Settings
    </Card.Title>
    <Card.Description>Configure VAT rate applied to all sales</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if taxSettingsQuery.isPending}
      <div class="flex items-center justify-center py-8">
        <Loader2Icon class="size-6 animate-spin" />
      </div>
    {:else if taxSettingsQuery.isError}
      <p class="text-destructive py-8 text-center">Failed to load VAT settings</p>
    {:else}
      <form
        class="space-y-6"
        onsubmit={(e) => {
          e.preventDefault();
          taxForm.handleSubmit();
        }}
      >
        <taxForm.Field name="enabled">
          {#snippet children(field)}
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Label class="text-base">Enable VAT</Label>
                <p class="text-muted-foreground text-sm">Apply VAT to transactions</p>
              </div>
              <Switch
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          {/snippet}
        </taxForm.Field>

        {#if taxForm.getFieldValue("enabled")}
          <div class="grid gap-4 sm:grid-cols-2">
            <taxForm.Field name="name">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>VAT Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder="VAT, GST, etc."
                  />
                </div>
              {/snippet}
            </taxForm.Field>

            <taxForm.Field name="rate">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>VAT Rate (%)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) =>
                      field.handleChange(Number.parseFloat(e.currentTarget.value) || 0)}
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    placeholder="8.875"
                  />
                </div>
              {/snippet}
            </taxForm.Field>
          </div>
        {/if}

        <div class="flex justify-end">
          <Button type="submit" class="gap-2" disabled={updateTaxMutation.isPending}>
            {#if updateTaxMutation.isPending}
              <Loader2Icon class="size-4 animate-spin" />
              Saving...
            {:else}
              <SaveIcon class="size-4" />
              Save Changes
            {/if}
          </Button>
        </div>
      </form>
    {/if}
  </Card.Content>
</Card.Root>
