<script lang="ts">
  import "@fontsource/inter";
  import { ConfirmDeleteDialog } from "@repo/ui/confirm-delete-dialog";
  import { Toaster } from "@repo/ui/sonner";
  import { QueryClientProvider, dehydrate } from "@tanstack/svelte-query";
  import { ModeWatcher } from "mode-watcher";
  import { onMount } from "svelte";

  import { browser } from "$app/environment";
  import { onNavigate } from "$app/navigation";
  import { env } from "$env/dynamic/public";
  import { createDehydratedScript } from "$lib/utils";

  import "../app.css";
  import type { LayoutProps } from "./$types";

  let { children, data }: LayoutProps = $props();

  onMount(async () => {
    if (env.PUBLIC_ENVIRONMENT === "development" && "serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  });

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:head>
  <link rel="manifest" href="/manifest.json" />
  {#if !browser}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html createDehydratedScript(dehydrate(data.queryClient))}
  {/if}
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  <ModeWatcher />
  <Toaster richColors />
  <ConfirmDeleteDialog />
  {@render children()}
</QueryClientProvider>
