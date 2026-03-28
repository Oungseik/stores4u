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
		...restProps
	}: Props = $props();

	let displayValue = $state("");

	function handleMaska(detail: { masked: string; unmasked: string }) {
		const unmasked = detail.unmasked;
		const parsed = Number.parseFloat(unmasked);
		if (!isNaN(parsed)) {
			let newValue = parsed;
			if (min !== undefined) newValue = Math.max(min, newValue);
			if (max !== undefined) newValue = Math.min(max, newValue);
			value = newValue;
		} else if (unmasked === "" || unmasked === "-") {
			value = 0;
		}
	}

	$effect(() => {
		if (value !== undefined && !disabled) {
			displayValue = new Intl.NumberFormat("en-US", {
				minimumFractionDigits: fraction,
				maximumFractionDigits: fraction,
			}).format(value);
		}
	});
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
