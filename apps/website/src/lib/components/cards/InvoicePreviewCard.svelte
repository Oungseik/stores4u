<script lang="ts">
  import XIcon from "@lucide/svelte/icons/x";
  import * as Card from "@repo/ui/card";
  import { ScrollArea } from "@repo/ui/scroll-area";

  interface Props {
    imageUrl?: string | null;
    fileType?: string | null;
  }

  let { imageUrl, fileType }: Props = $props();
</script>

<Card.Root class="h-fit lg:sticky lg:top-6 lg:col-start-2 lg:col-end-3 lg:row-start-1">
  <Card.Header>
    <Card.Title>Invoice Preview</Card.Title>
    <Card.Description>Original document uploaded</Card.Description>
  </Card.Header>
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
</Card.Root>
