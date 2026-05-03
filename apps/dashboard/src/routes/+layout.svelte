<script lang="ts">
  import { Toaster } from "@repo/ui/sonner";
  import { ModeWatcher } from "mode-watcher";

  import favicon from "$lib/assets/favicon.svg";

  import "./layout.css";

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster richColors />
{@render children()}
