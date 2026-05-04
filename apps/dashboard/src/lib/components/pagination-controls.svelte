<script lang="ts">
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { buttonVariants } from "@repo/ui/button";

  type Props = {
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    loading?: boolean;
  };

  const { hasPrev, hasNext, onPrev, onNext, loading = false }: Props = $props();
</script>

<div class="flex items-center justify-end gap-2 px-2">
  <button
    class={buttonVariants({ variant: "outline", size: "icon" })}
    onclick={onPrev}
    disabled={!hasPrev || loading}
  >
    <span class="sr-only">Previous</span>
    <ChevronLeftIcon />
  </button>
  <button
    class={buttonVariants({ variant: "outline", size: "icon" })}
    onclick={onNext}
    disabled={!hasNext || loading}
  >
    <span class="sr-only">Next</span>
    <ChevronRightIcon />
  </button>
</div>
