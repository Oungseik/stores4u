<script lang="ts">
  import BotIcon from "@lucide/svelte/icons/bot";
  import * as PromptInput from "@repo/ui/ai-elements/prompt-input";

  import { goto } from "$app/navigation";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  function handleSubmit(message: PromptInput.PromptInputMessage) {
    const threadId = crypto.randomUUID();
    goto(`/${data.slug}/chats/${threadId}`, {
      state: { initialMessage: message.text },
    });
  }
</script>

<div class="flex flex-1 flex-col overflow-hidden">
  <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
    <div class="bg-primary/10 flex size-12 items-center justify-center rounded-full">
      <BotIcon class="text-primary size-6" />
    </div>
    <div class="flex max-w-md flex-col gap-2">
      <h2 class="text-lg font-semibold">How can I help you today?</h2>
      <p class="text-muted-foreground text-sm">
        I can help you manage your inventory, analyze sales data, create reports, and answer
        questions about your shop.
      </p>
    </div>
  </div>

  <div class="mx-auto w-full max-w-4xl p-4 pt-0">
    <PromptInput.Root accept="image/*,.pdf" globalDrop maxFiles={5} onSubmit={handleSubmit}>
      <PromptInput.Attachments>
        {#snippet children(attachment)}
          <PromptInput.Attachment data={attachment} />
        {/snippet}
      </PromptInput.Attachments>
      <PromptInput.Toolbar class="flex-1">
        <PromptInput.Tools class="flex-1">
          <PromptInput.ActionMenu>
            <PromptInput.ActionMenuTrigger />
            <PromptInput.ActionMenuContent class="min-w-50">
              <PromptInput.ActionAddAttachments />
            </PromptInput.ActionMenuContent>
          </PromptInput.ActionMenu>
          <PromptInput.Textarea placeholder="Type a message..." class="flex-1" />
        </PromptInput.Tools>
        <PromptInput.Submit />
      </PromptInput.Toolbar>
    </PromptInput.Root>
    <p class="text-muted-foreground mt-2 text-center text-xs">
      AI can make mistakes. Please verify important information.
    </p>
  </div>
</div>
