<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import { onMount } from "svelte";

  let scanningLineY = $state(0);
  let scanningUp = $state(true);
  let scanned = $state(false);

  onMount(() => {
    const interval = setInterval(() => {
      if (scanningUp) {
        scanningLineY += 2;
        if (scanningLineY >= 85) {
          scanningUp = false;
          scanned = true;
          setTimeout(() => {
            scanned = false;
          }, 800);
        }
      } else {
        scanningLineY -= 2;
        if (scanningLineY <= 0) {
          scanningUp = true;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  });
</script>

<div class="relative mx-auto w-full max-w-[240px]">
  <div class="bg-muted relative aspect-[2/1] overflow-hidden rounded-xl">
    <!-- Corner brackets -->
    <div class="absolute inset-4">
      <div
        class="absolute top-0 left-0 h-6 w-6 rounded-tl-md border-t-3 border-l-3 border-emerald-500/50"
      ></div>
      <div
        class="absolute top-0 right-0 h-6 w-6 rounded-tr-md border-t-3 border-r-3 border-emerald-500/50"
      ></div>
      <div
        class="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-3 border-l-3 border-emerald-500/50"
      ></div>
      <div
        class="absolute right-0 bottom-0 h-6 w-6 rounded-br-md border-r-3 border-b-3 border-emerald-500/50"
      ></div>

      <!-- Barcode -->
      <div
        class={[
          "absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-center gap-[2px]",
          scanned ? "opacity-60" : "opacity-100",
        ]}
      >
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[4px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[4px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[1px]"></div>
        <div class="bg-foreground/80 h-16 w-[2px]"></div>
        <div class="bg-foreground/80 h-16 w-[3px]"></div>
      </div>

      <!-- Scanning line -->
      <div
        class={[
          "pointer-events-none absolute right-1 left-1 h-[2px] bg-emerald-400/70 shadow-[0_0_6px_1px_rgba(52,211,153,0.3)]",
          scanned ? "opacity-0" : "opacity-100",
        ]}
        style="top: {scanningLineY}%"
      ></div>

      <!-- Success overlay -->
      {#if scanned}
        <div class="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
          <div class="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5">
            <CheckIcon class="size-4 text-white" stroke-width={3} />
            <span class="text-xs font-medium text-white">Scanned!</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
