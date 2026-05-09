<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import LinkIcon from "@lucide/svelte/icons/link";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import UnlinkIcon from "@lucide/svelte/icons/unlink";
  import { PLATFORM_CONFIG, type SocialPlatform } from "@repo/config";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import { Label } from "@repo/ui/label";
  import { Switch } from "@repo/ui/switch";
  import { siFacebook, siTelegram, siTiktok, siViber } from "simple-icons";

  import type { SocialConnectionSelect } from "$lib/server/db";

  export interface Integration {
    id: string;
    platform: SocialPlatform;
    name: string;
    isConnected: boolean;
    connectedAccount?: {
      name: string;
      pageName: string;
      connectedAt: Date;
      avatar?: string;
    };
    permissions: SocialConnectionSelect["permissions"];
  }

  type Permissions = SocialConnectionSelect["permissions"];

  interface Props {
    integration: Integration;
    onConnect: (platform: SocialPlatform) => void;
    onDisconnect: (platform: SocialPlatform) => void;
    onUpdatePermissions: (platform: SocialPlatform, permissions: Permissions) => void;
  }

  let { integration, onConnect, onDisconnect, onUpdatePermissions }: Props = $props();

  let showPermissions = $state(false);

  const config = $derived(PLATFORM_CONFIG[integration.platform]);

  function handleTogglePermission(key: keyof SocialConnectionSelect["permissions"]) {
    const newPermissions = {
      ...integration.permissions,
      [key]: !integration.permissions[key],
    };
    onUpdatePermissions(integration.platform, newPermissions);
  }

  const platformIcons: Record<string, { path: string; class?: string }> = {
    FACEBOOK: { path: siFacebook.path },
    TIKTOK: { path: siTiktok.path, class: "text-foreground" },
    VIBER: { path: siViber.path },
    TELEGRAM: { path: siTelegram.path },
  };

  // function getPlatformIcon(platform: SocialPlatform) {
  //   const path = platformIcons[platform];
  //   if (!path) return "";
  //   return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="${path}"/></svg>`;
  // }
</script>

<Card.Root class="flex flex-col transition-all hover:shadow-md">
  <Card.Header class="pb-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style="background-color: {config.color}15; color: {config.color}"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class={["size-6", platformIcons[integration.platform].class]}
            ><path d={platformIcons[integration.platform].path} /></svg
          >
        </div>
        <div>
          <Card.Title class="text-lg">{config.name}</Card.Title>
          <div class="mt-1 flex items-center gap-2">
            {#if integration.isConnected}
              <Badge variant="default" class="gap-1 bg-emerald-500 hover:bg-emerald-600">
                <CheckIcon class="size-3" />
                Connected
              </Badge>
              <span class="text-muted-foreground text-xs">
                {integration.connectedAccount?.connectedAt.toLocaleDateString()}
              </span>
            {:else}
              <Badge variant="secondary">Not Connected</Badge>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Card.Header>

  <Card.Content class="flex flex-1 flex-col gap-4">
    <p class="text-muted-foreground text-sm leading-relaxed">
      {config.description}
    </p>

    {#if integration.isConnected && integration.connectedAccount}
      <div class="bg-muted rounded-lg p-3">
        <div class="flex items-center gap-3">
          <Avatar.Root class="size-10">
            {#if integration.connectedAccount.avatar}
              <Avatar.Image
                src={integration.connectedAccount.avatar}
                alt={integration.connectedAccount.name}
              />
            {/if}
            <Avatar.Fallback class="bg-primary text-primary-foreground text-sm">
              {integration.connectedAccount.name.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {integration.connectedAccount.name}
            </p>
            {#if integration.connectedAccount.pageName}
              <p class="text-muted-foreground truncate text-xs">
                {integration.connectedAccount.pageName}
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </Card.Content>

  <Card.Footer class="flex flex-col gap-3 pt-0">
    {#if integration.isConnected}
      <div class="flex w-full gap-2">
        <Button variant="outline" class="flex-1 gap-2" onclick={() => (showPermissions = true)}>
          <SettingsIcon class="size-4" />
          Configure
        </Button>
        <Button
          variant="destructive"
          class="gap-2"
          onclick={() => onDisconnect(integration.platform)}
        >
          <UnlinkIcon class="size-4" />
          Disconnect
        </Button>
      </div>
    {:else}
      <Button class="w-full gap-2" onclick={() => onConnect(integration.platform)}>
        <LinkIcon class="size-4" />
        Connect {config.name}
      </Button>
    {/if}
  </Card.Footer>
</Card.Root>

<!-- Permission Settings Dialog -->
<Dialog.Root bind:open={showPermissions}>
  <Dialog.Content class="px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title class="flex items-center gap-2">
        <span
          class="flex size-8 items-center justify-center rounded-lg"
          style="background-color: {config.color}15; color: {config.color}"
        >
          <!-- {@html getPlatformIcon(integration.platform)} -->
        </span>
        {config.name} Settings
      </Dialog.Title>
      <Dialog.Description>
        Configure posting permissions for your {config.name} account.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4 px-3 py-4 sm:px-4">
      <div class="bg-muted rounded-lg p-3">
        <div class="flex items-center gap-3">
          <Avatar.Root class="size-10">
            {#if integration.connectedAccount?.avatar}
              <Avatar.Image
                src={integration.connectedAccount.avatar}
                alt={integration.connectedAccount.name}
              />
            {/if}
            <Avatar.Fallback class="bg-primary text-primary-foreground text-sm">
              {integration.connectedAccount?.name.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {integration.connectedAccount?.name}
            </p>
            <Badge variant="outline" class="text-xs">Connected</Badge>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="text-sm font-medium">Posting Permissions</h4>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="auto-post-products">Auto-post Products</Label>
            <p class="text-muted-foreground text-xs">
              Automatically post when new products are added
            </p>
          </div>
          <Switch
            id="auto-post-products"
            checked={integration.permissions.autoPostProducts}
            onCheckedChange={() => handleTogglePermission("autoPostProducts")}
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="manual-posting">Manual Posting</Label>
            <p class="text-muted-foreground text-xs">
              Allow manual posting from the marketing page
            </p>
          </div>
          <Switch
            id="manual-posting"
            checked={integration.permissions.manualPosting}
            onCheckedChange={() => handleTogglePermission("manualPosting")}
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="post-promotions">Post Promotions</Label>
            <p class="text-muted-foreground text-xs">
              Automatically share sales and special offers
            </p>
          </div>
          <Switch
            id="post-promotions"
            checked={integration.permissions.postPromotions}
            onCheckedChange={() => handleTogglePermission("postPromotions")}
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="post-order-updates">Order Updates</Label>
            <p class="text-muted-foreground text-xs">
              Share order confirmations and shipping updates
            </p>
          </div>
          <Switch
            id="post-order-updates"
            checked={integration.permissions.postOrderUpdates}
            onCheckedChange={() => handleTogglePermission("postOrderUpdates")}
          />
        </div>
      </div>
    </div>

    <Dialog.Footer class="mx-0">
      <Button variant="outline" onclick={() => (showPermissions = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
