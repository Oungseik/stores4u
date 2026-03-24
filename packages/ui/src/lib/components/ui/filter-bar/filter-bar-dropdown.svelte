<script lang="ts" generics="T">
	import { buttonVariants } from '@lib/components/ui/button';
	import * as Popover from '@lib/components/ui/popover';
	import { cn } from '@lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import type { FilterBarDropdownProps } from './types.js';

	let {
		ref = $bindable(null),
		value = $bindable<T | null>(null),
		onValueChange,
		items = [],
		placeholder = 'All',
		label = 'Filter',
		class: className
	}: FilterBarDropdownProps<T> = $props();

	let open = $state(false);

	const selectedItem = $derived(items.find((i) => i.value === value));

	function handleSelect(itemValue: T | null) {
		const next = value === itemValue ? null : itemValue;
		value = next;
		onValueChange?.(next);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		bind:ref
		class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2', className)}
	>
		<FilterIcon class="size-4" />
		{selectedItem ? selectedItem.label : placeholder}
		<ChevronDownIcon class="size-3 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-56 p-0" align="start">
		<div class="px-1 py-1.5">
			<span class="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
				{label}
			</span>
		</div>
		<div class="border-t"></div>
		<div class="p-1">
			{#each items as item (item.value)}
				<button
					type="button"
					class="hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm"
					onclick={() => handleSelect(item.value)}
				>
					<span class={cn('flex-1 text-left', value === item.value && 'font-medium')}>
						{item.label}
					</span>
					{#if item.count !== undefined}
						<span class="text-muted-foreground text-xs">{item.count}</span>
					{/if}
				</button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
