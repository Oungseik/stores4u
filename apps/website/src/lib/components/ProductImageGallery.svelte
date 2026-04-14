<script lang="ts">
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import PackageIcon from "@lucide/svelte/icons/package";
  import { Button } from "@repo/ui/button";

  interface Props {
    images: Array<{
      src: string;
      alt: string;
    }>;
    mainImage?: string;
    productName: string;
  }

  let { images, mainImage, productName }: Props = $props();

  // Use mainImage if provided, otherwise use first image or placeholder
  const allImages = $derived(
    mainImage ? [{ src: mainImage, alt: productName }, ...images] : images
  );

  let currentIndex = $state(0);
  const currentImage = $derived(allImages[currentIndex] ?? allImages[0]);

  function goToNext() {
    currentIndex = (currentIndex + 1) % allImages.length;
  }

  function goToPrev() {
    currentIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
  }

  function goToIndex(index: number) {
    currentIndex = index;
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Main Image -->
  <div class="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg">
    {#if allImages.length > 0}
      <img src={currentImage.src} alt={currentImage.alt} class="size-full object-cover" />
    {:else}
      <div class="flex size-full items-center justify-center">
        <PackageIcon class="text-muted-foreground/40 size-24" />
      </div>
    {/if}

    <!-- Navigation Arrows -->
    {#if allImages.length > 1}
      <Button
        variant="outline"
        size="icon"
        onclick={goToPrev}
        class="absolute top-1/2 left-3 rounded-full active:translate-y-0"
        aria-label="Previous image"
      >
        <ChevronLeftIcon class="size-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={goToNext}
        class="absolute top-1/2 right-3 rounded-full active:translate-y-0"
        aria-label="Next image"
      >
        <ChevronRightIcon class="size-5" />
      </Button>
    {/if}

    <!-- Image Counter -->
    {#if allImages.length > 1}
      <div
        class="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
      >
        {currentIndex + 1} / {allImages.length}
      </div>
    {/if}
  </div>

  <!-- Thumbnails -->
  {#if allImages.length > 1}
    <div class="flex gap-2">
      {#each allImages as image, index}
        <button
          onclick={() => goToIndex(index)}
          class="bg-muted relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition-all {index ===
          currentIndex
            ? 'border-primary'
            : 'border-transparent hover:border-gray-300'}"
          aria-label="View image {index + 1}"
        >
          <img src={image.src} alt="Thumbnail {index + 1}" class="size-full object-cover" />
        </button>
      {/each}
    </div>
  {/if}
</div>
