<script lang="ts">
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ImageIcon from "@lucide/svelte/icons/image";

  type Props = {
    filename: string;
    fileType: string;
  };

  const { filename, fileType }: Props = $props();

  const truncatedFilename = $derived(
    filename.length > 25 ? `${filename.slice(0, 25)}...` : filename
  );
</script>

<div class="flex items-center gap-2.5">
  <div class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
    {#if fileType.startsWith("image/")}
      <ImageIcon class="text-primary size-4" />
    {:else}
      <FileTextIcon class="text-primary size-4" />
    {/if}
  </div>
  <span class="font-medium" title={filename}>{truncatedFilename}</span>
</div>
