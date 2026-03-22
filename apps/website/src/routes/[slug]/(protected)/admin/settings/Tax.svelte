<script lang="ts">
  import PercentIcon from "@lucide/svelte/icons/percent";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Checkbox } from "@repo/ui/checkbox";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Switch } from "@repo/ui/switch";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  const defaultSettings = {
    enabled: true,
    rate: 8.875,
    name: "Sales Tax",
    applyToAll: true,
  };

  const taxForm = createForm(() => ({
    defaultValues: defaultSettings,
    onSubmit: async ({ value }) => {
      console.log("Saving tax settings:", value);
      toast.success("Tax settings updated");
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <PercentIcon class="size-5" />
      Tax Settings
    </Card.Title>
    <Card.Description>Configure tax rates and application rules</Card.Description>
  </Card.Header>
  <Card.Content>
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
              <Label class="text-base">Enable Tax</Label>
              <p class="text-muted-foreground text-sm">Apply tax to transactions</p>
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
                <Label for={field.name}>Tax Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onblur={field.handleBlur}
                  onchange={(e) => field.handleChange(e.currentTarget.value)}
                  placeholder="Sales Tax, VAT, etc."
                />
              </div>
            {/snippet}
          </taxForm.Field>

          <taxForm.Field name="rate">
            {#snippet children(field)}
              <div class="space-y-2">
                <Label for={field.name}>Tax Rate (%)</Label>
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

        <taxForm.Field name="applyToAll">
          {#snippet children(field)}
            <div class="flex items-center gap-3">
              <Checkbox
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <Label>Apply tax to all products by default</Label>
            </div>
          {/snippet}
        </taxForm.Field>
      {/if}

      <div class="flex justify-end">
        <Button type="submit" class="gap-2">
          <SaveIcon class="size-4" />
          Save Changes
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
