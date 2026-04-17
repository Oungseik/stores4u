<script lang="ts">
  import * as FileDropZone from "@repo/ui/file-drop-zone";
  import { Textarea } from "@repo/ui/textarea";

  import { useAiChatChild } from "./ai-chat.svelte.js";
  import type { AiChatInputProps } from "./types.js";

  let {
    placeholder = "Type a message...",
    class: className,
    leading,
    children,
    ...rest
  }: AiChatInputProps = $props();

  const ctx = useAiChatChild();

  function handleSubmit(e?: Event) {
    ctx.handleSubmit(e);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const textareaClass =
    "bg-muted max-h-[120px] min-h-[40px] flex-1 resize-none border-0 px-3 py-2 text-sm [scrollbar-width:none] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden";
</script>

<form class={["mx-auto w-full p-3", className]} onsubmit={handleSubmit}>
  <div class="flex items-end gap-2">
    {#if leading}
      {@render leading()}
    {/if}
    {#if ctx.hasFileDropZone}
      <FileDropZone.Textarea>
        {#snippet child({ props })}
          <Textarea
            bind:value={ctx.inputText}
            bind:ref={ctx.textareaRef}
            {placeholder}
            rows={1}
            class={textareaClass}
            onkeydown={handleKeydown}
            oninput={() => ctx.adjustTextareaHeight()}
            {...props}
            {...rest}
          />
        {/snippet}
      </FileDropZone.Textarea>
    {:else}
      <Textarea
        bind:value={ctx.inputText}
        bind:ref={ctx.textareaRef}
        {placeholder}
        rows={1}
        class={textareaClass}
        onkeydown={handleKeydown}
        oninput={() => ctx.adjustTextareaHeight()}
        {...rest}
      />
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
</form>
