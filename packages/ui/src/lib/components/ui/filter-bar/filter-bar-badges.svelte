<script lang="ts">
	import { Badge } from '@lib/components/ui/badge';
	import { cn } from '@lib/utils.js';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FilterBadge } from './types.js';

	type Props = {
		ref?: HTMLDivElement | null;
		badges: FilterBadge[];
		class?: string;
	};

	let {
		ref = $bindable(null),
		badges,
		class: className
	}: Props = $props();
</script>

{#if badges.length > 0}
	<div bind:this={ref} data-slot="filter-bar-badges" class={cn('flex flex-wrap items-center gap-2', className)}>
		{#each badges as badge (badge.label)}
			<Badge variant="secondary" class="gap-1">
				{badge.label}: {badge.value}
				<button
					type="button"
					onclick={badge.onRemove}
					class="hover:text-primary ml-1"
				>
					<XIcon class="size-3" />
				</button>
			</Badge>
		{/each}
	</div>
{/if}
