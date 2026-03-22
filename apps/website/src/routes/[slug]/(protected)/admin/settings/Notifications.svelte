<script lang="ts">
  import MailIcon from "@lucide/svelte/icons/mail";
  import SaveIcon from "@lucide/svelte/icons/save";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Label } from "@repo/ui/label";
  import { Switch } from "@repo/ui/switch";
  import { createForm } from "@tanstack/svelte-form";
  import { toast } from "svelte-sonner";

  const defaultSettings = {
    emailReceipts: true,
    lowStockAlerts: true,
    dailyReports: false,
    newOrderNotifications: true,
  };

  const notificationForm = createForm(() => ({
    defaultValues: defaultSettings,
    onSubmit: async ({ value }) => {
      console.log("Saving notification settings:", value);
      toast.success("Notification preferences updated");
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <MailIcon class="size-5" />
      Notification Preferences
    </Card.Title>
    <Card.Description>Choose what notifications you want to receive</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      class="space-y-6"
      onsubmit={(e) => {
        e.preventDefault();
        notificationForm.handleSubmit();
      }}
    >
      <div class="space-y-4">
        <notificationForm.Field name="emailReceipts">
          {#snippet children(field)}
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Label class="text-base">Email Receipts</Label>
                <p class="text-muted-foreground text-sm">
                  Send email copies of receipts to customers
                </p>
              </div>
              <Switch
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          {/snippet}
        </notificationForm.Field>

        <notificationForm.Field name="lowStockAlerts">
          {#snippet children(field)}
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Label class="text-base">Low Stock Alerts</Label>
                <p class="text-muted-foreground text-sm">
                  Get notified when inventory is running low
                </p>
              </div>
              <Switch
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          {/snippet}
        </notificationForm.Field>

        <notificationForm.Field name="dailyReports">
          {#snippet children(field)}
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Label class="text-base">Daily Reports</Label>
                <p class="text-muted-foreground text-sm">
                  Receive daily sales summary via email
                </p>
              </div>
              <Switch
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          {/snippet}
        </notificationForm.Field>

        <notificationForm.Field name="newOrderNotifications">
          {#snippet children(field)}
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5">
                <Label class="text-base">New Order Notifications</Label>
                <p class="text-muted-foreground text-sm">Real-time alerts for new orders</p>
              </div>
              <Switch
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          {/snippet}
        </notificationForm.Field>
      </div>

      <div class="flex justify-end">
        <Button type="submit" class="gap-2">
          <SaveIcon class="size-4" />
          Save Changes
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
