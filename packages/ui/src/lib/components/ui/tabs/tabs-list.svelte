<script lang="ts">
	import { cn } from "@lib/utils.js";
	import { Tabs as TabsPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		"relative inline-flex h-auto w-full items-center justify-start gap-1 border-b border-border bg-transparent p-0",
		className
	)}
	{...restProps}
/>
