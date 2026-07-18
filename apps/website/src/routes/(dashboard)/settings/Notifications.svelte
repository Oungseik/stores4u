<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
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
      toast.success(msg.ui_notification_preferences_updated());
    },
  }));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <MailIcon class="size-5" />
      {msg.ui_notification_preferences()}
    </Card.Title>
    <Card.Description>{msg.ui_choose_what_notifications_you_want_to_receive()}</Card.Description>
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
                <Label class="text-base">{msg.ui_email_receipts()}</Label>
                <p class="text-muted-foreground text-sm">
                  {msg.ui_send_email_copies_of_receipts_to_customers()}
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
                <Label class="text-base">{msg.ui_low_stock_alerts()}</Label>
                <p class="text-muted-foreground text-sm">
                  {msg.ui_get_notified_when_inventory_is_running_low()}
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
                <Label class="text-base">{msg.ui_daily_reports()}</Label>
                <p class="text-muted-foreground text-sm">
                  {msg.ui_receive_daily_sales_summary_via_email()}
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
                <Label class="text-base">{msg.ui_new_order_notifications()}</Label>
                <p class="text-muted-foreground text-sm">
                  {msg.ui_real_time_alerts_for_new_orders()}
                </p>
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
          {msg.ui_save_changes()}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
