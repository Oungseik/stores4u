<script lang="ts" generics="T">
	import { buttonVariants } from '@lib/components/ui/button';
	import { Checkbox } from '@lib/components/ui/checkbox';
	import * as Popover from '@lib/components/ui/popover';
	import { cn } from '@lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import type { FilterBarCheckboxGroupProps } from './types.js';

	let {
		ref = $bindable(null),
		value = $bindable([]),
		onValueChange,
		items = [],
		placeholder = 'All',
		class: className
	}: FilterBarCheckboxGroupProps<T> = $props();

	let open = $state(false);

	function triggerLabel(): string {
		if (value.length === 0) return placeholder;
		return `${value.length} selected`;
	}

	function toggle(itemValue: T) {
		if (value.includes(itemValue)) {
			value = value.filter((v) => v !== itemValue);
		} else {
			value = [...value, itemValue];
		}
		onValueChange?.(value);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		bind:ref
		class={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'gap-2', className)}
	>
		<FilterIcon class="size-4" />
		{triggerLabel()}
		<ChevronDownIcon class="size-3 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-56 p-0" align="start">
		<div class="p-1">
			{#if items.length > 0}
			{#each items as item (item.value)}
				{@const checked = value.includes(item.value)}
				<button
					type="button"
					class="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm pe-2 ps-8 py-1.5 text-sm outline-hidden select-none w-full text-left"
					onclick={() => toggle(item.value)}
				>
					<span class="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
						<Checkbox {checked} onclick={() => {}} />
					</span>
					<span class="flex-1">{item.label}</span>
					{#if item.count !== undefined}
						<span class="text-muted-foreground text-xs">{item.count}</span>
					{/if}
				</button>
			{/each}
			{:else}
				<p class="text-muted-foreground px-2 py-2 text-center text-sm">No items</p>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
