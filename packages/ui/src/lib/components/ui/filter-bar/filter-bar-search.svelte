<script lang="ts">
	import { Input } from '@lib/components/ui/input';
	import { cn } from '@lib/utils.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	type Props = {
		ref?: HTMLInputElement | null;
		value?: string;
		placeholder?: string;
		class?: string;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
	};

	let {
		ref = $bindable(null),
		value = $bindable(''),
		placeholder = 'Search...',
		class: className,
		oninput
	}: Props = $props();
</script>

<div class="relative w-full lg:max-w-md">
	<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
	<Input
		bind:ref
		bind:value
		data-slot="filter-bar-search"
		{placeholder}
		{oninput}
		class={cn('pl-9', className)}
	/>
</div>
