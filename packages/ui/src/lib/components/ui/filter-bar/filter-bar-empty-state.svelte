<script lang="ts">
	import { cn } from '@lib/utils.js';
	import type { Component, Snippet } from 'svelte';
	import { useFilterBarChild } from './filter-bar.svelte.js';

	type Props = {
		ref?: HTMLDivElement | null;
		icon?: Component<{ class?: string }>;
		title: string;
		emptyMessage: string;
		filteredMessage: string;
		children?: Snippet;
		class?: string;
	};

	let {
		ref = $bindable(null),
		icon: Icon,
		title,
		emptyMessage,
		filteredMessage,
		class: className,
		children
	}: Props = $props();

	const ctx = useFilterBarChild();
</script>

<div
	bind:this={ref}
	data-slot="filter-bar-empty-state"
	class={cn('flex flex-col items-center justify-center py-16 text-center', className)}
>
	{#if Icon}
		<div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
			<Icon class="text-muted-foreground size-8" />
		</div>
	{/if}
	<h3 class="text-lg font-semibold">{title}</h3>
	<p class="text-muted-foreground max-w-sm text-sm">
		{ctx.opts.hasFilters.current ? filteredMessage : emptyMessage}
	</p>
	{#if children}
		{@render children?.()}
	{/if}
</div>
