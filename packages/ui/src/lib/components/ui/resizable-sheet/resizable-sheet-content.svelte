<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@lib/utils.js";
	import XIcon from "@lucide/svelte/icons/x";
	import { Dialog as SheetPrimitive } from "bits-ui";
	import type { ComponentProps, Snippet } from "svelte";
	import SheetOverlay from "../sheet/sheet-overlay.svelte";
	import SheetPortal from "../sheet/sheet-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		style,
		side = "right",
		width = $bindable(400),
		minWidth = 300,
		maxWidth = 800,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: "left" | "right";
		width?: number;
		minWidth?: number;
		maxWidth?: number;
		children: Snippet;
	} = $props();

	let isResizing = $state(false);

	function handlePointerDown(e: PointerEvent) {
		e.preventDefault();
		isResizing = true;
		const startX = e.clientX;
		const startWidth = width;

		function onPointerMove(e: PointerEvent) {
			const deltaX =
				side === "left"
					? e.clientX - startX
					: startX - e.clientX;
			width = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
		}

		function onPointerUp() {
			isResizing = false;
			document.body.classList.remove("select-none");
			document.removeEventListener("pointermove", onPointerMove);
			document.removeEventListener("pointerup", onPointerUp);
		}

		document.body.classList.add("select-none");
		document.addEventListener("pointermove", onPointerMove);
		document.addEventListener("pointerup", onPointerUp);
	}

	const handlePosition = side === "left" ? "end-0" : "start-0";
	const contentPadding = side === "left" ? "pe-3" : "ps-3";
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content
		bind:ref
		data-slot="resizable-sheet-content"
		style="{style ?? ''} width: {width}px;"
		class={cn(
			"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
			side === "left" && "data-[state=closed]:slide-out-to-start data-[state=open]:slide-in-from-start inset-y-0 start-0 h-full border-e",
			side === "right" && "data-[state=closed]:slide-out-to-end data-[state=open]:slide-in-from-end inset-y-0 end-0 h-full border-s",
			contentPadding,
			className,
		)}
		{...restProps}
	>
		<div
			class="{handlePosition} absolute top-0 bottom-0 z-50 w-1 cursor-col-resize transition-colors hover:bg-primary/50 {isResizing ? 'bg-primary' : 'bg-border'}"
			onpointerdown={handlePointerDown}
		></div>

		<div class="flex h-full flex-col px-4 py-4">
			{@render children?.()}
		</div>

		<SheetPrimitive.Close
			class="ring-offset-background focus-visible:ring-ring absolute end-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Close</span>
		</SheetPrimitive.Close>
	</SheetPrimitive.Content>
</SheetPortal>
