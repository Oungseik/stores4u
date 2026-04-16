<script lang="ts">
  import "@fontsource/inter";
  import { ConfirmDeleteDialog } from "@repo/ui/confirm-delete-dialog";
  import { Toaster } from "@repo/ui/sonner";
  import { QueryClientProvider, dehydrate } from "@tanstack/svelte-query";
  import { ModeWatcher } from "mode-watcher";

  import { browser } from "$app/environment";
  import { onNavigate } from "$app/navigation";
  import { createDehydratedScript } from "$lib/utils";

  import "../app.css";
  import type { LayoutProps } from "./$types";

  let { children, data }: LayoutProps = $props();

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
