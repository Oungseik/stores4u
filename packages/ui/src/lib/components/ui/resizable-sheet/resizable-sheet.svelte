<script lang="ts">
	import type { WithoutChildrenOrChild } from "@lib/utils.js";
	import { Dialog as SheetPrimitive } from "bits-ui";
	import type { ComponentProps, Snippet } from "svelte";
	import SheetDescription from "../sheet/sheet-description.svelte";
	import SheetFooter from "../sheet/sheet-footer.svelte";
	import SheetHeader from "../sheet/sheet-header.svelte";
	import SheetTitle from "../sheet/sheet-title.svelte";
	import ResizableSheetContent from "./resizable-sheet-content.svelte";

	let {
		open = $bindable(false),
		side = "right",
		title,
		description,
		header,
		footer,
		children,
		defaultWidth = 400,
		minWidth = 300,
		maxWidth = 800,
		contentProps,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.RootProps> & {
		side?: "left" | "right";
		title?: string;
		description?: string;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		defaultWidth?: number;
		minWidth?: number;
		maxWidth?: number;
		contentProps?: WithoutChildrenOrChild<ComponentProps<typeof ResizableSheetContent>>;
	} = $props();

	let width = $state(defaultWidth);
</script>

<SheetPrimitive.Root bind:open {...restProps}>
	<ResizableSheetContent
		{side}
		bind:width
		{minWidth}
		{maxWidth}
		{...contentProps}
	>
		{#if title || description || header}
			<SheetHeader>
				{#if header}
					{@render header()}
				{:else}
					{#if title}
						<SheetTitle>{title}</SheetTitle>
					{/if}
					{#if description}
						<SheetDescription>{description}</SheetDescription>
					{/if}
				{/if}
			</SheetHeader>
		{/if}

		{@render children?.()}

		{#if footer}
			<SheetFooter>
				{@render footer()}
			</SheetFooter>
		{/if}
	</ResizableSheetContent>
</SheetPrimitive.Root>
