<script lang="ts">
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Checkbox } from "@repo/ui/checkbox";
  import { Label } from "@repo/ui/label";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  const defaultSettings = {
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: false,
    footerText: "Thank you for your business!",
  };

  const receiptForm = createForm(() => ({
    defaultValues: defaultSettings,
    onSubmit: async ({ value }) => {
      console.log("Saving receipt settings:", value);
      toast.success("Receipt settings updated");
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <ReceiptIcon class="size-5" />
      Receipt Customization
    </Card.Title>
    <Card.Description>Customize what appears on customer receipts</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      class="space-y-6"
      onsubmit={(e) => {
        e.preventDefault();
        receiptForm.handleSubmit();
      }}
    >
      <div class="space-y-4">
        <h3 class="text-sm font-medium">Receipt Elements</h3>
        <div class="space-y-3">
          <receiptForm.Field name="showLogo">
            {#snippet children(field)}
              <div class="flex items-center gap-3">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label>Show shop logo on receipts</Label>
              </div>
            {/snippet}
          </receiptForm.Field>

          <receiptForm.Field name="showAddress">
            {#snippet children(field)}
              <div class="flex items-center gap-3">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label>Show business address</Label>
              </div>
            {/snippet}
          </receiptForm.Field>

          <receiptForm.Field name="showPhone">
            {#snippet children(field)}
              <div class="flex items-center gap-3">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label>Show phone number</Label>
              </div>
            {/snippet}
          </receiptForm.Field>

          <receiptForm.Field name="showEmail">
            {#snippet children(field)}
              <div class="flex items-center gap-3">
                <Checkbox
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label>Show email address</Label>
              </div>
            {/snippet}
          </receiptForm.Field>
        </div>
      </div>

      <Separator />

      <receiptForm.Field name="footerText">
        {#snippet children(field)}
          <div class="space-y-2">
            <Label for={field.name}>Receipt Footer Text</Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onblur={field.handleBlur}
              onchange={(e) => field.handleChange(e.currentTarget.value)}
              placeholder="Thank you message or return policy"
              rows={2}
            />
            <p class="text-muted-foreground text-xs">
              This text appears at the bottom of every receipt
            </p>
          </div>
        {/snippet}
      </receiptForm.Field>

      <div class="flex justify-end">
        <Button type="submit" class="gap-2">
          <SaveIcon class="size-4" />
          Save Changes
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
