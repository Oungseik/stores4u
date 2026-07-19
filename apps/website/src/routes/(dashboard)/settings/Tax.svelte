<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PercentIcon from "@lucide/svelte/icons/percent";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import { Switch } from "@repo/ui/switch";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { orpc } from "$lib/orpc_client";

  const queryClient = useQueryClient();
  const taxSettingsQuery = createQuery(() =>
    orpc.tax.get.queryOptions({
      input: {},
    }),
  );

  const updateTaxMutation = createMutation(() =>
    orpc.tax.update.mutationOptions({
      onSuccess: async () => {
        toast.success(msg.ui_vat_settings_updated());
        await queryClient.invalidateQueries({ queryKey: orpc.tax.key() });
        taxForm.reset();
      },
      onError: (error: { message?: string }) => {
        toast.error(localizeError(error, "ui_failed_to_update_vat_settings"));
      },
    }),
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
        ...value,
      });
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <PercentIcon class="size-5" />
      {msg.ui_vat_settings()}
    </Card.Title>
    <Card.Description>{msg.ui_configure_vat_rate_applied_to_all_sales()}</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if taxSettingsQuery.isPending}
      <div class="flex items-center justify-center py-8">
        <Loader2Icon class="size-6 animate-spin" />
      </div>
    {:else if taxSettingsQuery.isError}
      <p class="text-destructive py-8 text-center">{msg.ui_failed_to_load_vat_settings()}</p>
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
                <Label class="text-base">{msg.ui_enable_vat()}</Label>
                <p class="text-muted-foreground text-sm">{msg.ui_apply_vat_to_transactions()}</p>
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
                  <Label for={field.name}>{msg.ui_vat_name()}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onblur={field.handleBlur}
                    onchange={(e) => field.handleChange(e.currentTarget.value)}
                    placeholder={msg.ui_vat_gst_etc()}
                  />
                </div>
              {/snippet}
            </taxForm.Field>

            <taxForm.Field name="rate">
              {#snippet children(field)}
                <div class="space-y-2">
                  <Label for={field.name}>{msg.ui_vat_rate()}</Label>
                  <NumberInput
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                    onblur={field.handleBlur}
                    fraction={3}
                    min={0}
                    max={100}
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
              {msg.ui_saving()}
            {:else}
              <SaveIcon class="size-4" />
              {msg.ui_save_changes()}
            {/if}
          </Button>
        </div>
      </form>
    {/if}
  </Card.Content>
</Card.Root>
