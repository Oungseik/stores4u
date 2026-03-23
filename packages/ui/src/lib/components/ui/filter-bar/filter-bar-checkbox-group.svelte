<script lang="ts">
	import { buttonVariants } from '@lib/components/ui/button';
	import CheckboxGroup from '@lib/components/ui/dropdown-menu/dropdown-menu-checkbox-group.svelte';
	import CheckboxItem from '@lib/components/ui/dropdown-menu/dropdown-menu-checkbox-item.svelte';
	import Label from '@lib/components/ui/dropdown-menu/dropdown-menu-label.svelte';
	import Separator from '@lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte';
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
		label = 'Filter',
		class: className
	}: FilterBarCheckboxGroupProps = $props();

	let open = $state(false);

	function triggerLabel(): string {
		if (value.length === 0) return placeholder;
		if (value.length === 1) return value[0];
		return `${value.length} selected`;
	}

	function handleValueChange(next: string[]) {
		value = next;
		onValueChange?.(next);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		bind:ref
		class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2', className)}
	>
		<FilterIcon class="size-4" />
		{triggerLabel()}
		<ChevronDownIcon class="size-3 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-56 p-0" align="start">
		<div class="px-1 py-1.5">
			<Label>{label}</Label>
		</div>
		<Separator />
		<div class="p-1">
			<CheckboxGroup {value} onValueChange={handleValueChange}>
				{#each items as item (item.value)}
					<CheckboxItem value={item.value} checked={value.includes(item.value)}>
						<span class="flex-1">{item.label}</span>
						{#if item.count !== undefined}
							<span class="text-muted-foreground text-xs">{item.count}</span>
						{/if}
					</CheckboxItem>
				{/each}
			</CheckboxGroup>
		</div>
	</Popover.Content>
</Popover.Root>
