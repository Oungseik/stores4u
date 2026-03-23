<script lang="ts">
	import type { CalendarDate, DateValue } from '@internationalized/date';
	import { buttonVariants } from '@lib/components/ui/button';
	import * as Popover from '@lib/components/ui/popover';
	import { RangeCalendar } from '@lib/components/ui/range-calendar';
	import { cn } from '@lib/utils.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { FilterBarDatePickerProps, FilterBarDateRange } from './types.js';

	let {
		ref = $bindable(null),
		value,
		onValueChange,
		placeholder = 'All Dates',
		numberOfMonths = 2,
		class: className
	}: FilterBarDatePickerProps = $props();

	let open = $state(false);

	let internal = $state<{ start: DateValue | null; end: DateValue | null }>({
		start: null,
		end: null
	});

	$effect(() => {
		internal = { start: value?.start ?? null, end: value?.end ?? null };
	});

	function calendarValue() {
		if (internal.start && internal.end) {
			return { start: internal.start, end: internal.end };
		}
		if (internal.start) {
			return { start: internal.start, end: undefined as unknown as CalendarDate };
		}
		return undefined;
	}

	function handleChange(
		v: { start: DateValue | undefined; end: DateValue | undefined } | undefined
	) {
		if (v?.start && v?.end) {
			const range: FilterBarDateRange = { start: v.start, end: v.end };
			internal = range;
			open = false;
			onValueChange?.(range);
		} else if (v?.start) {
			internal = { start: v.start, end: null };
		} else {
			internal = { start: null, end: null };
			onValueChange?.({ start: null, end: null });
		}
	}

	function label(): string {
		if (!value?.start || !value?.end) return placeholder;
		const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
		return `${fmt.format(value.start.toDate('UTC'))} - ${fmt.format(value.end.toDate('UTC'))}`;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		bind:ref
		class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2', className)}
	>
		<CalendarIcon class="size-4" />
		{label()}
		<ChevronDownIcon class="size-3 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<RangeCalendar value={calendarValue()} onValueChange={handleChange} {numberOfMonths} />
	</Popover.Content>
</Popover.Root>
