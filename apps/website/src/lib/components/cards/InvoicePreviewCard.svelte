<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Card from "@repo/ui/card";
  import * as Collapsible from "@repo/ui/collapsible";
  import { ScrollArea } from "@repo/ui/scroll-area";

  interface Props {
    imageUrl?: string | null;
    fileType?: string | null;
    class?: string;
  }

  let { imageUrl, fileType, class: className }: Props = $props();

  let open = $state(false);

  $effect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    open = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      open = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });
</script>

<Card.Root class="h-fit xl:sticky xl:top-6 xl:col-start-2 xl:col-end-3 xl:row-start-1 {className}">
  <Card.Header class="flex flex-row items-start justify-between">
    <div>
      <Card.Title>{msg.ui_invoice_preview()}</Card.Title>
      <Card.Description>{msg.ui_original_document_uploaded()}</Card.Description>
    </div>
  </Card.Header>
  <Collapsible.Root bind:open>
    <Collapsible.Trigger
      class="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 py-2 text-sm transition-colors xl:hidden"
    >
      <ChevronsUpDownIcon class="size-4" />
      {open ? msg.ui_hide_preview() : msg.ui_show_preview()}
    </Collapsible.Trigger>
    <Collapsible.Content>
      <Card.Content>
        {#if imageUrl}
          <ScrollArea class="h-[calc(100vh-160px)] min-h-100">
            {#if fileType === "application/pdf"}
              <iframe
                src={imageUrl}
                title={msg.ui_invoice_pdf()}
                class="h-full min-h-96 w-full rounded-lg border"
              ></iframe>
            {:else}
              <img
                src={imageUrl}
                alt={msg.ui_invoice()}
                class="w-full rounded-lg border object-contain"
              />
            {/if}
          </ScrollArea>
        {:else}
          <div class="bg-muted flex aspect-[3/4] items-center justify-center rounded-lg border">
            <div class="text-muted-foreground flex flex-col items-center gap-2">
              <XIcon class="size-12" />
              <p class="text-sm">{msg.ui_unable_to_load_invoice_preview()}</p>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Collapsible.Content>
  </Collapsible.Root>
</Card.Root>
