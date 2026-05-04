<script lang="ts">
  import { PLATFORM_CONFIG, type SocialPlatform } from "@repo/config";
  import * as Card from "@repo/ui/card";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";

  import PlatformCard, { type Integration } from "$lib/components/cards/PlatformCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import ConnectionModal from "$lib/components/modals/SocialConnectionModal.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const allPlatforms: SocialPlatform[] = ["FACEBOOK", "TIKTOK", "VIBER", "TELEGRAM"];

  const defaultPermissions = {
    autoPostProducts: false,
    manualPosting: false,
    postPromotions: false,
    postOrderUpdates: false,
  };

  const queryClient = useQueryClient();

  const connectionsQuery = createQuery(() =>
    orpc.social.list.queryOptions({
      input: { slug: params.slug },
      enabled: !!params.slug,
    })
  );

  const disconnectMutation = createMutation(() =>
    orpc.social.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.social.list.key() });
      },
    })
  );

  const updatePermissionsMutation = createMutation(() =>
    orpc.social.updatePermissions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.social.list.key() });
      },
    })
  );

  let connectingPlatform = $state<SocialPlatform | null>(null);
  let isConnectionModalOpen = $state(false);

  const integrations = $derived((): Integration[] => {
    const connections = connectionsQuery.data || [];

    return allPlatforms.map((platform) => {
      const connection = connections.find((c) => c.platform === platform);
      const config = PLATFORM_CONFIG[platform];

      if (connection) {
        return {
          id: connection.id,
          platform,
          name: config.name,
          isConnected: true,
          connectedAccount: connection.connectedAccount,
          permissions: connection.permissions,
        };
      }

      return {
        id: platform,
        platform,
        name: config.name,
        isConnected: false,
        permissions: defaultPermissions,
      };
    });
  });

  function handleConnect(platform: SocialPlatform) {
    connectingPlatform = platform;
    isConnectionModalOpen = true;
  }

  async function handleDisconnect(platform: SocialPlatform) {
    await disconnectMutation.mutateAsync({
      slug: params.slug,
      platform,
    });
  }

  async function handleUpdatePermissions(
    platform: SocialPlatform,
    permissions: Integration["permissions"]
  ) {
    await updatePermissionsMutation.mutateAsync({
      slug: params.slug,
      platform,
      permissions,
    });
  }

  function handleConnectionSuccess() {
    queryClient.invalidateQueries({ queryKey: orpc.social.list.key() });
    isConnectionModalOpen = false;
    connectingPlatform = null;
  }

  const connectedCount = $derived(integrations().filter((i) => i.isConnected).length);
</script>

<div class="@container/main flex flex-1 flex-col gap-2">
  <div class="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="px-4 lg:px-6">
      <AdminDashboardHeader
        breadcrumbs={[{ label: "Dashboard", href: `/${params.slug}` }, { label: "Integrations" }]}
      />
    </div>

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
                  {connectedCount} / {integrations().length}
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>
    </div>

    <div class="flex-1 px-4 lg:px-6">
      <div class="grid grid-cols-1 gap-4 @md:grid-cols-2 @xl:grid-cols-2">
        {#each integrations() as integration (integration.id)}
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

<ConnectionModal
  isOpen={isConnectionModalOpen}
  platform={connectingPlatform}
  onClose={() => {
    isConnectionModalOpen = false;
    connectingPlatform = null;
  }}
  onConnect={handleConnectionSuccess}
/>
