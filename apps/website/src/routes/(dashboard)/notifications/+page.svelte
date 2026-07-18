<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import BellIcon from "@lucide/svelte/icons/bell";
  import CheckCheckIcon from "@lucide/svelte/icons/check-check";
  import InfoIcon from "@lucide/svelte/icons/info";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import XCircleIcon from "@lucide/svelte/icons/x-circle";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { flip } from "svelte/animate";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";
  import { receive, send } from "./transition";

  const { params }: PageProps = $props();

  type NotificationType = "low_stock" | "out_of_stock" | "info";

  interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    description: string;
    productId: number;
    isRead: boolean;
    isPinned: boolean;
    createdAt: Date;
  }

  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: "low_stock",
      title: msg.ui_coffee_beans(),
      description: msg.ui_running_low_5_left(),
      productId: 1,
      isRead: false,
      isPinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 2,
      type: "out_of_stock",
      title: msg.ui_milk(),
      description: msg.ui_out_of_stock_8b78c7a(),
      productId: 2,
      isRead: false,
      isPinned: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: 3,
      type: "low_stock",
      title: msg.ui_sugar(),
      description: msg.ui_3_items_remaining(),
      productId: 3,
      isRead: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
    {
      id: 4,
      type: "info",
      title: msg.ui_system_update(),
      description: msg.ui_new_features_available(),
      productId: 0,
      isRead: false,
      isPinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: 5,
      type: "out_of_stock",
      title: msg.ui_bread_loaf(),
      description: msg.ui_out_of_stock_8b78c7a(),
      productId: 5,
      isRead: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      id: 6,
      type: "low_stock",
      title: msg.ui_orange_juice(),
      description: msg.ui_running_low_8_left(),
      productId: 6,
      isRead: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ];

  let notifications = $state(mockNotifications);

  const unreadCount = $derived(notifications.filter((n) => !n.isRead).length);
  const pinnedNotifications = $derived(
    notifications
      .filter((n) => n.isPinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );
  const todayNotifications = $derived(
    notifications
      .filter((n) => !n.isPinned && isToday(n.createdAt))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );
  const earlierNotifications = $derived(
    notifications
      .filter((n) => !n.isPinned && !isToday(n.createdAt))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return msg.ui_just_now();
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return msg.ui_yesterday();
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function getNotificationStyle(type: NotificationType) {
    switch (type) {
      case "low_stock":
        return {
          icon: AlertTriangleIcon,
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          iconColor: "text-amber-600 dark:text-amber-400",
          badgeVariant: "secondary" as const,
          badgeText: msg.ui_low_stock(),
        };
      case "out_of_stock":
        return {
          icon: XCircleIcon,
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          badgeVariant: "destructive" as const,
          badgeText: msg.ui_out_of_stock(),
        };
      case "info":
        return {
          icon: InfoIcon,
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          badgeVariant: "default" as const,
          badgeText: msg.ui_info(),
        };
    }
  }

  function markAsRead(id: number) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  }

  function markAllAsRead() {
    notifications = notifications.map((n) => ({ ...n, isRead: true }));
  }

  function togglePin(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    notifications = notifications.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }

  function deleteNotification(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    notifications = notifications.filter((n) => n.id !== id);
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
  }
</script>

<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_notifications() }]}
  >
    {#snippet actions()}
      <Button
        variant="outline"
        class={["gap-2", unreadCount === 0 && "hidden"]}
        onclick={markAllAsRead}
      >
        <CheckCheckIcon class="size-4" />
        {msg.ui_mark_all_read()}
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <ScrollArea.Root class="h-[calc(100dvh-var(--header-height)-var(--spacing)*16)]">
    {#if notifications.length === 0}
      <div
        class="flex h-[calc(100dvh-var(--header-height)-var(--spacing)*20)] flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div class="bg-muted flex size-16 items-center justify-center rounded-full">
          <BellIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_notifications()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">{msg.ui_you_re_all_caught_up()}</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#if pinnedNotifications.length > 0}
          <div>
            <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              {msg.ui_pinned()}
            </p>
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                {#each pinnedNotifications as notification (notification.id)}
                  {@const style = getNotificationStyle(notification.type)}
                  <div
                    in:receive={{ key: notification.id }}
                    out:send={{ key: notification.id }}
                    animate:flip={{ duration: 200 }}
                    class="hover:bg-muted/50 relative flex w-full cursor-pointer items-center gap-3 border-b px-3 py-3 last:border-b-0"
                    onclick={() => handleNotificationClick(notification)}
                    onkeydown={(e) => e.key === "Enter" && handleNotificationClick(notification)}
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="flex size-9 shrink-0 items-center justify-center rounded-full {style.bgColor}"
                    >
                      <style.icon class="size-4 {style.iconColor}" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p class="truncate text-sm font-semibold">
                          {notification.title}
                        </p>
                        <Badge
                          variant={style.badgeVariant}
                          class="shrink-0 px-1.5 py-0 text-[10px]"
                        >
                          {style.badgeText}
                        </Badge>
                      </div>
                      <p class="text-muted-foreground mt-0.5 text-xs">{notification.description}</p>
                    </div>

                    <div class="flex w-[80px] shrink-0 flex-col items-end gap-1">
                      <span class="text-muted-foreground text-xs"
                        >{formatRelativeTime(notification.createdAt)}</span
                      >
                      <div class="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => togglePin(notification.id, e)}
                          aria-label={msg.ui_unpin_notification()}
                        >
                          <PinIcon class="text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => deleteNotification(notification.id, e)}
                          aria-label={msg.ui_delete_notification()}
                        >
                          <TrashIcon class="text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                {/each}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}

        {#if todayNotifications.length > 0}
          <div>
            <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              {msg.ui_today()}
            </p>
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                {#each todayNotifications as notification (notification.id)}
                  {@const style = getNotificationStyle(notification.type)}
                  <div
                    in:receive={{ key: notification.id }}
                    out:send={{ key: notification.id }}
                    animate:flip={{ duration: 200 }}
                    class="hover:bg-muted/50 relative flex w-full cursor-pointer items-center gap-3 border-b border-l-2 px-3 py-3 last:border-b-0 {!notification.isRead
                      ? 'bg-primary/5 border-l-primary'
                      : 'border-l-transparent opacity-70'}"
                    onclick={() => handleNotificationClick(notification)}
                    onkeydown={(e) => e.key === "Enter" && handleNotificationClick(notification)}
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="flex size-9 shrink-0 items-center justify-center rounded-full {style.bgColor}"
                    >
                      <style.icon class="size-4 {style.iconColor}" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p
                          class="truncate text-sm {!notification.isRead
                            ? 'font-semibold'
                            : 'font-medium'}"
                        >
                          {notification.title}
                        </p>
                        <Badge
                          variant={style.badgeVariant}
                          class="shrink-0 px-1.5 py-0 text-[10px]"
                        >
                          {style.badgeText}
                        </Badge>
                      </div>
                      <p class="text-muted-foreground mt-0.5 text-xs">{notification.description}</p>
                    </div>

                    <div class="flex w-[80px] shrink-0 flex-col items-end gap-1">
                      <span class="text-muted-foreground text-xs"
                        >{formatRelativeTime(notification.createdAt)}</span
                      >
                      <div class="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => togglePin(notification.id, e)}
                          aria-label={msg.ui_pin_notification()}
                        >
                          <PinOffIcon class="text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => deleteNotification(notification.id, e)}
                          aria-label={msg.ui_delete_notification()}
                        >
                          <TrashIcon class="text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                {/each}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}

        {#if earlierNotifications.length > 0}
          <div>
            <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              {msg.ui_earlier()}
            </p>
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                {#each earlierNotifications as notification (notification.id)}
                  {@const style = getNotificationStyle(notification.type)}
                  <div
                    in:receive={{ key: notification.id }}
                    out:send={{ key: notification.id }}
                    animate:flip={{ duration: 200 }}
                    class="hover:bg-muted/50 relative flex w-full cursor-pointer items-center gap-3 border-b border-l-2 px-3 py-3 last:border-b-0 {!notification.isRead
                      ? 'bg-primary/5 border-l-primary'
                      : 'border-l-transparent opacity-70'}"
                    onclick={() => handleNotificationClick(notification)}
                    onkeydown={(e) => e.key === "Enter" && handleNotificationClick(notification)}
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="flex size-9 shrink-0 items-center justify-center rounded-full {style.bgColor}"
                    >
                      <style.icon class="size-4 {style.iconColor}" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p
                          class="truncate text-sm {!notification.isRead
                            ? 'font-semibold'
                            : 'font-medium'}"
                        >
                          {notification.title}
                        </p>
                        <Badge
                          variant={style.badgeVariant}
                          class="shrink-0 px-1.5 py-0 text-[10px]"
                        >
                          {style.badgeText}
                        </Badge>
                      </div>
                      <p class="text-muted-foreground mt-0.5 text-xs">{notification.description}</p>
                    </div>

                    <div class="flex w-[80px] shrink-0 flex-col items-end gap-1">
                      <span class="text-muted-foreground text-xs"
                        >{formatRelativeTime(notification.createdAt)}</span
                      >
                      <div class="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => togglePin(notification.id, e)}
                          aria-label={msg.ui_pin_notification()}
                        >
                          <PinOffIcon class="text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onclick={(e) => deleteNotification(notification.id, e)}
                          aria-label={msg.ui_delete_notification()}
                        >
                          <TrashIcon class="text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                {/each}
              </Card.Content>
            </Card.Root>
          </div>
        {/if}
      </div>
    {/if}
  </ScrollArea.Root>
</section>
