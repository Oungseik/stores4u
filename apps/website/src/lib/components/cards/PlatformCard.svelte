<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import LinkIcon from "@lucide/svelte/icons/link";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import UnlinkIcon from "@lucide/svelte/icons/unlink";
  import { PLATFORM_CONFIG, type PlatformType, type SocialPlatform } from "@repo/config";
  import * as Avatar from "@repo/ui/avatar";
  import { Badge } from "@repo/ui/badge";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import { Switch } from "@repo/ui/switch";

  interface Props {
    integration: SocialPlatform;
    onConnect: (platform: PlatformType) => void;
    onDisconnect: (platform: PlatformType) => void;
    onUpdatePermissions: (
      platform: PlatformType,
      permissions: SocialPlatform["permissions"]
    ) => void;
  }

  let { integration, onConnect, onDisconnect, onUpdatePermissions }: Props = $props();

  let showPermissions = $state(false);

  const config = $derived(PLATFORM_CONFIG[integration.platform]);

  function handleTogglePermission(key: keyof SocialPlatform["permissions"]) {
    const newPermissions = {
      ...integration.permissions,
      [key]: !integration.permissions[key],
    };
    onUpdatePermissions(integration.platform, newPermissions);
  }

  function getPlatformIcon(platform: PlatformType) {
    // Simple SVG icons for each platform
    switch (platform) {
      case "facebook":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
      case "tiktok":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`;
      case "viber":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M16.676 2.628a21.9 21.9 0 0 0-9.555 0l-.339.075a4.9 4.9 0 0 0-3.684 3.58a19.5 19.5 0 0 0 0 9.577a4.9 4.9 0 0 0 3.444 3.52l.465 2.776a.5.5 0 0 0 .826.29l2.731-2.443a22 22 0 0 0 6.112-.487l.34-.075a4.9 4.9 0 0 0 3.684-3.58a19.5 19.5 0 0 0 0-9.577a4.9 4.9 0 0 0-3.685-3.58zM7.965 6.202a.82.82 0 0 0-.537.106h-.014c-.375.22-.713.497-1.001.823c-.24.277-.37.557-.404.827c-.02.16-.006.322.041.475l.018.01c.27.793.622 1.556 1.052 2.274a13.4 13.4 0 0 0 2.03 2.775l.024.034l.038.028l.023.027l.028.024a13.6 13.6 0 0 0 2.782 2.04c1.155.629 1.856.926 2.277 1.05v.006c.123.038.235.055.348.055a1.6 1.6 0 0 0 .964-.414c.325-.288.6-.627.814-1.004v-.007c.201-.38.133-.738-.157-.981A12 12 0 0 0 14.41 13c-.448-.243-.903-.096-1.087.15l-.393.496c-.202.246-.568.212-.568.212l-.01.006c-2.731-.697-3.46-3.462-3.46-3.462s-.034-.376.219-.568l.492-.396c.236-.192.4-.646.147-1.094a12 12 0 0 0-1.347-1.88a.75.75 0 0 0-.44-.263M12.579 5a.5.5 0 0 0 0 1c1.265 0 2.315.413 3.146 1.205c.427.433.76.946.978 1.508c.219.563.319 1.164.293 1.766a.5.5 0 0 0 1 .042a5.4 5.4 0 0 0-.361-2.17a5.4 5.4 0 0 0-1.204-1.854l-.01-.01C15.39 5.502 14.085 5 12.579 5m-.034 1.644a.5.5 0 0 0 0 1h.017c.912.065 1.576.369 2.041.868c.477.514.724 1.153.705 1.943a.5.5 0 0 0 1 .023c.024-1.037-.31-1.932-.972-2.646V7.83c-.677-.726-1.606-1.11-2.724-1.185l-.017-.002zm-.019 1.675a.5.5 0 1 0-.052.998c.418.022.685.148.853.317c.169.17.295.443.318.87a.5.5 0 1 0 .998-.053c-.032-.6-.22-1.13-.605-1.52c-.387-.39-.914-.58-1.512-.612" clip-rule="evenodd"/></svg>`;
      case "telegram":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;
    }
  }
</script>

<Card.Root class="flex flex-col transition-all hover:shadow-md">
  <Card.Header class="pb-4">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style="background-color: {config.color}15; color: {config.color}"
        >
          {@html getPlatformIcon(integration.platform)}
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
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <span
          class="flex size-8 items-center justify-center rounded-lg"
          style="background-color: {config.color}15; color: {config.color}"
        >
          {@html getPlatformIcon(integration.platform)}
        </span>
        {config.name} Settings
      </Dialog.Title>
      <Dialog.Description>
        Configure posting permissions for your {config.name} account.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4 py-4">
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
            <label for="auto-post-products" class="text-sm font-medium">Auto-post Products</label>
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
            <label for="manual-posting" class="text-sm font-medium">Manual Posting</label>
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
            <label for="post-promotions" class="text-sm font-medium">Post Promotions</label>
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
            <label for="post-order-updates" class="text-sm font-medium">Order Updates</label>
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

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (showPermissions = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
