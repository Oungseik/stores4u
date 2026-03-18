<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import CheckIcon from "@lucide/svelte/icons/check";
  import GlobeIcon from "@lucide/svelte/icons/globe";
  import LockIcon from "@lucide/svelte/icons/lock";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import UserIcon from "@lucide/svelte/icons/user";
  import { PLATFORM_CONFIG, type PlatformType } from "@repo/config";
  import * as Avatar from "@repo/ui/avatar";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";

  interface Props {
    isOpen: boolean;
    platform: PlatformType | null;
    onClose: () => void;
    onConnect: () => void;
  }

  let { isOpen, platform, onClose, onConnect }: Props = $props();

  let step = $state(1);
  let isConnecting = $state(false);
  let isConnected = $state(false);

  const totalSteps = 3;

  $effect(() => {
    if (!isOpen) {
      step = 1;
      isConnecting = false;
      isConnected = false;
    }
  });

  const config = $derived(platform ? PLATFORM_CONFIG[platform] : null);

  const mockAccounts = $derived([
    {
      id: "1",
      name: "My Business Page",
      avatar: null,
      pageName: "Official Page",
    },
    {
      id: "2",
      name: "Personal Profile",
      avatar: null,
      pageName: null,
    },
  ]);

  let selectedAccount = $state<string | null>(null);

  function handleNext() {
    if (step < totalSteps) {
      step++;
    }
  }

  function handleBack() {
    if (step > 1) {
      step--;
    }
  }

  async function handleConnect() {
    isConnecting = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isConnecting = false;
    isConnected = true;
  }

  function handleFinish() {
    onConnect();
    onClose();
  }

  function getPlatformIcon(platform: PlatformType) {
    switch (platform) {
      case "facebook":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
      case "tiktok":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`;
      case "viber":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M16.676 2.628a21.9 21.9 0 0 0-9.555 0l-.339.075a4.9 4.9 0 0 0-3.684 3.58a19.5 19.5 0 0 0 0 9.577a4.9 4.9 0 0 0 3.444 3.52l.465 2.776a.5.5 0 0 0 .826.29l2.731-2.443a22 22 0 0 0 6.112-.487l.34-.075a4.9 4.9 0 0 0 3.684-3.58a19.5 19.5 0 0 0 0-9.577a4.9 4.9 0 0 0-3.685-3.58zM7.965 6.202a.82.82 0 0 0-.537.106h-.014c-.375.22-.713.497-1.001.823c-.24.277-.37.557-.404.827c-.02.16-.006.322.041.475l.018.01c.27.793.622 1.556 1.052 2.274a13.4 13.4 0 0 0 2.03 2.775l.024.034l.038.028l.023.027l.028.024a13.6 13.6 0 0 0 2.782 2.04c1.155.629 1.856.926 2.277 1.05v.006c.123.038.235.055.348.055a1.6 1.6 0 0 0 .964-.414c.325-.288.6-.627.814-1.004v-.007c.201-.38.133-.738-.157-.981A12 12 0 0 0 14.41 13c-.448-.243-.903-.096-1.087.15l-.393.496c-.202.246-.568.212-.568.212l-.01.006c-2.731-.697-3.46-3.462-3.46-3.462s-.034-.376.219-.568l.492-.396c.236-.192.4-.646.147-1.094a12 12 0 0 0-1.347-1.88a.75.75 0 0 0-.44-.263M12.579 5a.5.5 0 0 0 0 1c1.265 0 2.315.413 3.146 1.205c.427.433.76.946.978 1.508c.219.563.319 1.164.293 1.766a.5.5 0 0 0 1 .042a5.4 5.4 0 0 0-.361-2.17a5.4 5.4 0 0 0-1.204-1.854l-.01-.01C15.39 5.502 14.085 5 12.579 5m-.034 1.644a.5.5 0 0 0 0 1h.017c.912.065 1.576.369 2.041.868c.477.514.724 1.153.705 1.943a.5.5 0 0 0 1 .023c.024-1.037-.31-1.932-.972-2.646V7.83c-.677-.726-1.606-1.11-2.724-1.185l-.017-.002zm-.019 1.675a.5.5 0 1 0-.052.998c.418.022.685.148.853.317c.169.17.295.443.318.87a.5.5 0 1 0 .998-.053c-.032-.6-.22-1.13-.605-1.52c-.387-.39-.914-.58-1.512-.612" clip-rule="evenodd"/></svg>`;
      case "telegram":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="size-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;
    }
  }
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content class="sm:max-w-[500px]">
    {#if isConnected}
      <!-- Success State -->
      <div class="flex flex-col items-center justify-center py-8">
        <div class="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-full">
          <CheckIcon class="text-primary size-8" />
        </div>
        <h3 class="mb-2 text-xl font-semibold">Connection Successful!</h3>
        <p class="text-muted-foreground mb-6 text-center text-sm">
          Your {config?.name} account has been successfully connected.
        </p>
        <Button onclick={handleFinish}>Finish</Button>
      </div>
    {:else}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          {#if config}
            <span
              class="flex size-8 items-center justify-center rounded-lg"
              style="background-color: {config.color}15; color: {config.color}"
            >
              {@html getPlatformIcon(platform!)}
            </span>
            Connect {config.name}
          {/if}
        </Dialog.Title>
        <Dialog.Description>
          Step {step} of {totalSteps}: {step === 1
            ? "Sign In"
            : step === 2
              ? "Select Account"
              : "Permissions"}
        </Dialog.Description>
      </Dialog.Header>

      <div class="min-h-[200px] py-4">
        {#if step === 1}
          <!-- Step 1: Sign In -->
          <div class="flex flex-col gap-4">
            <div class="bg-muted rounded-lg p-6">
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full"
                >
                  <UserIcon class="size-5" />
                </div>
                <div>
                  <p class="text-sm font-medium">Sign in to {config?.name}</p>
                  <p class="text-muted-foreground text-xs">You'll be redirected to authenticate</p>
                </div>
              </div>
              <Button class="w-full gap-2" onclick={handleNext}>
                {#if config}
                  <span style="color: {config.color}">
                    {@html getPlatformIcon(platform!)}
                  </span>
                {/if}
                Continue with {config?.name}
              </Button>
            </div>
            <div class="text-muted-foreground flex items-center gap-2 text-xs">
              <LockIcon class="size-3" />
              <span>Your credentials are secure and never stored on our servers</span>
            </div>
          </div>
        {:else if step === 2}
          <!-- Step 2: Select Account -->
          <div class="flex flex-col gap-4">
            <p class="text-muted-foreground text-sm">
              Select the account or page you want to connect:
            </p>
            <div class="flex flex-col gap-2">
              {#each mockAccounts as account}
                <Button
                  variant="outline"
                  class={[
                    "h-auto justify-start p-3",
                    selectedAccount === account.id && "border-primary bg-primary/5",
                  ]}
                  onclick={() => (selectedAccount = account.id)}
                >
                  <Avatar.Root class="size-10">
                    {#if account.avatar}
                      <Avatar.Image src={account.avatar} alt={account.name} />
                    {/if}
                    <Avatar.Fallback class="bg-primary text-primary-foreground text-sm">
                      {account.name.charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div class="flex-1">
                    <p class="text-sm font-medium">{account.name}</p>
                    {#if account.pageName}
                      <p class="text-muted-foreground text-xs">{account.pageName}</p>
                    {/if}
                  </div>
                  {#if selectedAccount === account.id}
                    <CheckIcon class="text-primary size-5" />
                  {/if}
                </Button>
              {/each}
            </div>
          </div>
        {:else if step === 3}
          <!-- Step 3: Permissions -->
          <div class="flex flex-col gap-4">
            <p class="text-muted-foreground text-sm">Review the permissions we're requesting:</p>
            <div class="bg-muted rounded-lg p-4">
              <div class="flex flex-col gap-3">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-primary/10 mt-0.5 flex size-6 items-center justify-center rounded-full"
                  >
                    <GlobeIcon class="text-primary size-3" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">Post Content</p>
                    <p class="text-muted-foreground text-xs">
                      Create and publish posts on your behalf
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div
                    class="bg-primary/10 mt-0.5 flex size-6 items-center justify-center rounded-full"
                  >
                    <ShieldIcon class="text-primary size-3" />
                  </div>
                  <div>
                    <p class="text-sm font-medium">Manage Pages</p>
                    <p class="text-muted-foreground text-xs">
                      Access your pages and profile information
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-muted-foreground text-xs">
              You can modify these permissions later in the integration settings.
            </p>
          </div>
        {/if}
      </div>

      <Dialog.Footer class="flex justify-between">
        <Button variant="outline" onclick={handleBack} disabled={step === 1 || isConnecting}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back
        </Button>

        {#if step < totalSteps}
          <Button onclick={handleNext} disabled={step === 2 && !selectedAccount}>
            Next
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        {:else}
          <Button onclick={handleConnect} disabled={isConnecting}>
            {#if isConnecting}
              <div
                class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                data-icon="inline-start"
              ></div>
              Connecting...
            {:else}
              Connect Account
            {/if}
          </Button>
        {/if}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
