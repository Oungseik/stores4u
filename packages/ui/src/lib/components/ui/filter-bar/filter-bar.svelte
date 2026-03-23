<script lang="ts">
	import { cn } from '@lib/utils.js';
	import { box } from 'svelte-toolbelt';
	import { useFilterBar } from './filter-bar.svelte.js';
	import type { FilterBarRootProps } from './types.js';

	let {
		ref = $bindable(null),
		hasFilters = false,
		onReset = () => {},
		class: className,
		children
	}: FilterBarRootProps = $props();

	useFilterBar({
		hasFilters: box.with(() => hasFilters),
		onReset: box.with(() => onReset)
	});
</script>

<div bind:this={ref} class={cn('flex flex-col items-start gap-2 lg:flex-row', className)}>
	{@render children?.()}
</div>
