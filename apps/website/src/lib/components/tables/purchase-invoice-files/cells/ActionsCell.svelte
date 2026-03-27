<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { Button, buttonVariants } from "@repo/ui/button";

  type Props = {
    id: string;
    slug: string;
    status: string;
    isProcessing: boolean;
    onProcess: (id: string) => void;
  };

  const { id, slug, status, isProcessing, onProcess }: Props = $props();
</script>

{#if isProcessing}
  <div class="text-muted-foreground flex items-center gap-2">
    <Loader2Icon class="size-4 animate-spin" />
    <span class="text-sm">Processing...</span>
  </div>
{:else if status === "UPLOADED"}
  <Button variant="outline" size="sm" onclick={() => onProcess(id)}>
    <PlayIcon class="mr-1 size-4" />
    Process
  </Button>
{:else if status === "PROCESSED"}
  <a href={`/${slug}/admin/purchases/review?fileId=${id}`} class={buttonVariants({ size: "sm" })}>
    <SearchIcon class="mr-1 size-4" />
    Review
  </a>
{:else if status === "PROCESSING"}
  <div class="text-muted-foreground flex items-center gap-2">
    <Loader2Icon class="size-4 animate-spin" />
    <span class="text-sm">Processing...</span>
  </div>
{:else if status === "REVIEWED"}
  <Button variant="outline" size="sm" disabled>
    <SearchIcon class="mr-1 size-4" />
    Reviewed
  </Button>
{:else if status === "FAILED"}
  <Button variant="outline" size="sm" onclick={() => onProcess(id)}>
    <PlayIcon class="mr-1 size-4" />
    Retry
  </Button>
{/if}
