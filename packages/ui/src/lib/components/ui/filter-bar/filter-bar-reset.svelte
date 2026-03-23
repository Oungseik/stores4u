<script lang="ts">
	import { Button } from '@lib/components/ui/button';
	import { cn } from '@lib/utils.js';
	import XIcon from '@lucide/svelte/icons/x';
	import { useFilterBarChild } from './filter-bar.svelte.js';

	let { class: className }: { class?: string } = $props();

	const ctx = useFilterBarChild();
</script>

{#if ctx.opts.hasFilters.current}
	<Button
		data-slot="filter-bar-reset"
		variant="ghost"
		size="sm"
		onclick={() => ctx.opts.onReset.current()}
		class={cn('gap-2', className)}
	>
		<XIcon class="size-4" />
		Reset
	</Button>
{/if}
