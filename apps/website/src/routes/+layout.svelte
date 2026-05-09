<script lang="ts">
  import { ConfirmDeleteDialog } from "@repo/ui/confirm-delete-dialog";
  import { Toaster } from "@repo/ui/sonner";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { ModeWatcher } from "mode-watcher";

  import { onNavigate } from "$app/navigation";

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
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  <ModeWatcher />
  <Toaster richColors />
  <ConfirmDeleteDialog />
  {@render children()}
</QueryClientProvider>
