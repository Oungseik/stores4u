<script lang="ts">
  import * as FileDropZone from "@repo/ui/file-drop-zone";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatFileDropZoneProps } from "./types.js";

  let {
    accept = "image/*",
    maxFiles = 5,
    maxFileSize = 5 * 1000 * 1000,
    class: className,
    children,
  }: AiChatFileDropZoneProps = $props();

  const ctx = useAiChatChild();

  ctx.hasFileDropZone = true;

  async function handleUpload(files: File[]) {
    ctx.addFiles(files);
  }
</script>

<FileDropZone.Root
  {accept}
  {maxFiles}
  {maxFileSize}
  fileCount={ctx.pendingFiles.length}
  onUpload={handleUpload}
  onFileRejected={({ reason, file }) => {
    console.warn(`File rejected: ${file.name} - ${reason}`);
  }}
>
  <div class={className}>
    {@render children()}
  </div>
</FileDropZone.Root>
