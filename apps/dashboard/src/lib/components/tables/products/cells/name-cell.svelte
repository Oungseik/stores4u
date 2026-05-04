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

<a href={`/shops/${slug}/products/${id}`} class="group flex items-center gap-3">
  <div class="size-10 shrink-0 overflow-hidden rounded-md bg-muted/40">
    {#if image}
      <img src={image} alt={name} class="size-full object-cover" />
    {:else}
      <div class="flex size-full items-center justify-center">
        <PackageIcon class="size-5 text-muted-foreground/40" />
      </div>
    {/if}
  </div>
  <span class="font-medium group-hover:underline">{name}</span>
</a>
