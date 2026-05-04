<script lang="ts">
  import PackageIcon from "@lucide/svelte/icons/package";

  type Props = {
    id: string;
    name: string;
    image: string | null;
    slug: string;
  };

  const { id, name, image, slug }: Props = $props();
</script>

<a href={`/shops/${slug}/products/${id}`} class="flex items-center gap-3 group">
  <div class="bg-muted/40 size-10 shrink-0 overflow-hidden rounded-md">
    {#if image}
      <img src={image} alt={name} class="size-full object-cover" />
    {:else}
      <div class="flex size-full items-center justify-center">
        <PackageIcon class="text-muted-foreground/40 size-5" />
      </div>
    {/if}
  </div>
  <span class="font-medium group-hover:underline">{name}</span>
</a>
