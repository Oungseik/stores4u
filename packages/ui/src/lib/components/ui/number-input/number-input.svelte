<script lang="ts">
	import { cn, type WithElementRef } from "@lib/utils.js";
	import { maska } from "maska/svelte";

	type Props = WithElementRef<{
		value?: number;
		fraction?: number;
		disabled?: boolean;
		min?: number;
		max?: number;
		class?: string;
		placeholder?: string;
		unsigned?: boolean;
		onValueChange?: (value: number) => void;
		onblur?: () => void;
	}>;

	let {
		ref = $bindable(null),
		value = $bindable(0),
		fraction = 2,
		disabled = false,
		min,
		max,
		class: className,
		placeholder,
		unsigned = true,
		onValueChange,
		onblur,
		...restProps
	}: Props = $props();

	let displayValue = $state("");
	let focused = $state(false);
	let lastInternalValue = $state(value);

	function formatDisplay(val: number) {
		displayValue = new Intl.NumberFormat("en-US", {
			minimumFractionDigits: fraction,
			maximumFractionDigits: fraction,
		}).format(val);
	}

	function handleMaska(detail: { masked: string; unmasked: string }) {
		const unmasked = detail.unmasked;
		const parsed = Number.parseFloat(unmasked);
		if (!isNaN(parsed)) {
			let newValue = parsed;
			if (min !== undefined) newValue = Math.max(min, newValue);
			if (max !== undefined) newValue = Math.min(max, newValue);
			value = newValue;
			lastInternalValue = newValue;
			onValueChange?.(newValue);
		} else if (unmasked === "" || unmasked === "-") {
			value = 0;
			lastInternalValue = 0;
			onValueChange?.(0);
		}
	}

	$effect(() => {
		if (value !== undefined && !focused) {
			if (value !== lastInternalValue || !disabled) {
				formatDisplay(value);
			}
			lastInternalValue = value;
		}
	});

	function handleBlur() {
		focused = false;
		if (value !== undefined) {
			formatDisplay(value);
		}
		onblur?.();
	}
</script>

{#if disabled}
	<div
		class={cn(
			"border-input bg-background flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs md:text-sm",
			"cursor-not-allowed opacity-50",
			className
		)}
		{...restProps}
	>
		{new Intl.NumberFormat("en-US", {
			minimumFractionDigits: fraction,
			maximumFractionDigits: fraction,
		}).format(value)}
	</div>
{:else}
	<input
		bind:this={ref}
		type="text"
		inputmode="decimal"
		class={cn(
			"border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
			"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
			"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
			className
		)}
		bind:value={displayValue}
		{placeholder}
		{disabled}
		onfocus={() => (focused = true)}
		onblur={handleBlur}
		use:maska={{
			number: {
				locale: "en-US",
				fraction,
				unsigned,
			},
			onMaska: handleMaska,
		}}
		{...restProps}
	/>
{/if}
