<script lang="ts">
	import StoreIcon from "@lucide/svelte/icons/store";
	import * as Card from "@repo/ui/card";
	import { Skeleton } from "@repo/ui/skeleton";
	import { page } from "$app/state";
	import { getMyShops } from "$lib/remote/shops/get_my_shops.remote";

	const slug = $derived(page.params.slug);
	const shops = getMyShops();
	const shop = $derived.by(async () => {
		const list = await shops;
		return list.find((s) => s.slug === slug);
	});
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
	<div class="w-full max-w-lg">
		{#await shop}
			<Card.Root>
				<Card.Header>
					<Skeleton class="h-6 w-3/4" />
					<Skeleton class="h-4 w-1/2" />
				</Card.Header>
				<Card.Content>
					<Skeleton class="h-4 w-2/3" />
				</Card.Content>
			</Card.Root>
		{:then resolved}
			{#if resolved}
				<Card.Root>
					<Card.Header class="text-center">
						<div class="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-full">
							<StoreIcon class="text-primary size-6" />
						</div>
						<Card.Title class="text-2xl">{resolved.name}</Card.Title>
						<Card.Description>/{resolved.slug}</Card.Description>
					</Card.Header>
					<Card.Content class="text-center">
						<p class="text-muted-foreground text-sm">
							Shop management features are coming soon.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root class="border-destructive/50">
					<Card.Content class="py-12 text-center">
						<p class="text-sm text-destructive">Shop not found.</p>
					</Card.Content>
				</Card.Root>
			{/if}
		{:catch error}
			<Card.Root class="border-destructive/50">
				<Card.Content class="py-12 text-center">
					<p class="text-sm text-destructive">
						{error instanceof Error ? error.message : "Failed to load shop."}
					</p>
				</Card.Content>
			</Card.Root>
		{/await}
	</div>
</div>
