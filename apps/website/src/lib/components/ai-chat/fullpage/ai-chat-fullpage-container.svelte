<script lang="ts">
  import type { AiChatFullPageContainerProps } from "../types.js";

  let { class: className, children }: AiChatFullPageContainerProps = $props();
</script>

<div
  data-slot="ai-chat-fullpage-container"
  class={["flex h-full flex-1 flex-col overflow-hidden", className]}
>
  {@render children()}
</div>
