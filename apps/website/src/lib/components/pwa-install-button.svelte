<script lang="ts">
  import DownloadIcon from "@lucide/svelte/icons/download";

  import { browser } from "$app/environment";

  type BeforeInstallPromptEvent = Event & {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };

  let deferredPrompt = $state<BeforeInstallPromptEvent | undefined>(undefined);
  let dismissed = $state(false);

  if (browser) {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = undefined;
    });
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") dismissed = true;
    deferredPrompt = undefined;
  }
</script>

{#if deferredPrompt && !dismissed}
  <button
    onclick={handleInstall}
    class="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
  >
    <DownloadIcon size={16} />
    Install
  </button>
{/if}
