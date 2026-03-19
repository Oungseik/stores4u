<script lang="ts">
  import type { PlatformType, SocialPlatform } from "@repo/config";
  import * as Card from "@repo/ui/card";

  import PlatformCard from "$lib/components/cards/PlatformCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import ConnectionModal from "$lib/components/modals/SocialConnectionModal.svelte";

  import type { PageProps } from "./$types";

  export const MOCK_INTEGRATIONS: SocialPlatform[] = [
    {
      id: "1",
      platform: "facebook",
      name: "Facebook",
      isConnected: true,
      connectedAccount: {
        name: "John Smith",
        pageName: "Coffee Shop Official",
        connectedAt: new Date("2024-12-15"),
      },
      permissions: {
        autoPostProducts: true,
        manualPosting: true,
        postPromotions: true,
        postOrderUpdates: false,
      },
    },
    {
      id: "2",
      platform: "tiktok",
      name: "TikTok",
      isConnected: false,
      permissions: {
        autoPostProducts: false,
        manualPosting: false,
        postPromotions: false,
        postOrderUpdates: false,
      },
    },
    {
      id: "3",
      platform: "viber",
      name: "Viber",
      isConnected: true,
      connectedAccount: {
        name: "Coffee Shop",
        pageName: "Business Account",
        connectedAt: new Date("2024-11-20"),
      },
      permissions: {
        autoPostProducts: false,
        manualPosting: true,
        postPromotions: true,
        postOrderUpdates: true,
      },
    },
    {
      id: "4",
      platform: "telegram",
      name: "Telegram",
      isConnected: false,
      permissions: {
        autoPostProducts: false,
        manualPosting: false,
        postPromotions: false,
        postOrderUpdates: false,
      },
    },
  ];

  const { params }: PageProps = $props();

  let integrations = $state(MOCK_INTEGRATIONS);

  let connectingPlatform = $state<PlatformType | null>(null);
  let isConnectionModalOpen = $state(false);

  function handleConnect(platform: PlatformType) {
    connectingPlatform = platform;
    isConnectionModalOpen = true;
  }

  function handleDisconnect(platform: PlatformType) {
    // Update local state to simulate disconnection
    integrations = integrations.map((i) =>
      i.platform === platform
        ? {
            ...i,
            isConnected: false,
            connectedAccount: undefined,
          }
        : i
    );
  }

  function handleUpdatePermissions(
    platform: PlatformType,
    permissions: SocialPlatform["permissions"]
  ) {
    integrations = integrations.map((i) => (i.platform === platform ? { ...i, permissions } : i));
  }

  function handleConnectionSuccess() {
    if (connectingPlatform) {
      // Update local state to simulate connection
      integrations = integrations.map((i) =>
        i.platform === connectingPlatform
          ? {
              ...i,
              isConnected: true,
              connectedAccount: {
                name: "Connected User",
                pageName: "Business Page",
                connectedAt: new Date(),
              },
            }
          : i
      );
    }
    isConnectionModalOpen = false;
    connectingPlatform = null;
  }

  const connectedCount = $derived(integrations.filter((i) => i.isConnected).length);
</script>

<div class="@container/main flex flex-1 flex-col gap-2">
  <div class="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="px-4 lg:px-6">
      <AdminDashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: `/${params.slug}/admin` },
          { label: "Integrations" },
        ]}
      />
    </div>

    <!-- Page Header -->
    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Social Media Integrations</h1>
          <p class="text-muted-foreground mt-1 text-sm">
            Connect your social media accounts to automate posting and reach your audience.
          </p>
        </div>
        <div class="flex items-center gap-4">
          <Card.Root class="bg-muted border-0 p-0">
            <Card.Content class="flex items-center gap-3 px-4 py-2">
              <div class="flex flex-col">
                <span class="text-muted-foreground text-xs">Connected</span>
                <span class="text-lg font-semibold">
                  {connectedCount} / {integrations.length}
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    </div>

    <!-- Platform Cards Grid -->
    <div class="flex-1 px-4 lg:px-6">
      <div class="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-2">
        {#each integrations as integration (integration.id)}
          <PlatformCard
            {integration}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onUpdatePermissions={handleUpdatePermissions}
          />
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Connection Modal -->
<ConnectionModal
  isOpen={isConnectionModalOpen}
  platform={connectingPlatform}
  onClose={() => {
    isConnectionModalOpen = false;
    connectingPlatform = null;
  }}
  onConnect={handleConnectionSuccess}
/>
