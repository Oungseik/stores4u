<script lang="ts">
	import { cn } from "@lib/utils.js";

	let { class: className }: { class?: string } = $props();
</script>

<span class={cn("thinking-dots text-muted-foreground", className)}>
	<span class="dot">•</span><span class="dot">•</span><span class="dot">•</span>
</span>

<style>
	.thinking-dots .dot {
		display: inline-block;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.thinking-dots .dot:nth-child(1) {
		animation-delay: 0s;
	}

	.thinking-dots .dot:nth-child(2) {
		animation-delay: 0.16s;
	}

	.thinking-dots .dot:nth-child(3) {
		animation-delay: 0.32s;
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			opacity: 0.3;
		}
		40% {
			opacity: 1;
		}
	}
</style>
