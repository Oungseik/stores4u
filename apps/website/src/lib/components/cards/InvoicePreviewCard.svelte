<script lang="ts">
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Collapsible from "@repo/ui/collapsible";
  import { ScrollArea } from "@repo/ui/scroll-area";

  interface Props {
    imageUrl?: string | null;
    fileType?: string | null;
    class?: string;
    onDownload?: () => void;
  }

  let { imageUrl, fileType, class: className, onDownload }: Props = $props();

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
      <Card.Title>Invoice Preview</Card.Title>
      <Card.Description>Original document uploaded</Card.Description>
    </div>
    {#if onDownload}
      <Button variant="outline" size="sm" onclick={onDownload}>
        <DownloadIcon class="size-4" />
        Download
      </Button>
    {/if}
  </Card.Header>
  <Collapsible.Root bind:open>
    <Collapsible.Trigger
      class="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 py-2 text-sm transition-colors xl:hidden"
    >
      <ChevronsUpDownIcon class="size-4" />
      {open ? "Hide Preview" : "Show Preview"}
    </Collapsible.Trigger>
    <Collapsible.Content>
      <Card.Content>
        {#if imageUrl}
          <ScrollArea class="h-[calc(100vh-160px)] min-h-100">
            {#if fileType === "application/pdf"}
              <iframe
                src={imageUrl}
                title="Invoice PDF"
                class="h-full min-h-96 w-full rounded-lg border"
              ></iframe>
            {:else}
              <img src={imageUrl} alt="Invoice" class="w-full rounded-lg border object-contain" />
            {/if}
          </ScrollArea>
        {:else}
          <div class="bg-muted flex aspect-[3/4] items-center justify-center rounded-lg border">
            <div class="text-muted-foreground flex flex-col items-center gap-2">
              <XIcon class="size-12" />
              <p class="text-sm">Unable to load invoice preview</p>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Collapsible.Content>
  </Collapsible.Root>
</Card.Root>
