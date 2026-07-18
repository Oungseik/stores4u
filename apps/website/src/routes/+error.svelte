<script lang="ts">
  import { buttonVariants } from "@repo/ui/button";
  import { page } from "$app/state";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
</script>

<svelte:head>
  <title>{msg.something_went_wrong()}</title>
</svelte:head>

<main class="flex min-h-svh items-center justify-center p-6">
  <div class="flex max-w-md flex-col items-center gap-4 text-center">
    <p class="text-muted-foreground text-sm">{page.status}</p>
    <h1 class="text-2xl font-semibold">{msg.something_went_wrong()}</h1>
    <p class="text-muted-foreground">{localizeError(page.error)}</p>
    <a href="/" class={buttonVariants()}>{msg.ui_go_back()}</a>
  </div>
</main>
