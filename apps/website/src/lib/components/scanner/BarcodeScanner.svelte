<script lang="ts">
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import { Html5Qrcode } from "html5-qrcode";
  import { tick } from "svelte";

  import { browser } from "$app/environment";

  interface Props {
    containerId?: string;
    onScan?: (barcode: string) => void;
    class?: string;
  }

  let { containerId = "barcode-scanner", onScan, class: className = "" }: Props = $props();

  let isScanning = $state(false);
  let hasCameraPermission = $state<boolean | null>(null);
  let scannerError = $state<string | null>(null);
  let html5QrCode: Html5Qrcode | null = null;

  async function startScanner() {
    if (!browser) return;

    try {
      await tick();
      const element = document.getElementById(containerId);
      if (!element) {
        console.error("Scanner container not found");
        return;
      }

      html5QrCode = new Html5Qrcode(containerId);
      isScanning = true;
      scannerError = null;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onScan?.(decodedText);
        },
        () => {}
      );

      hasCameraPermission = true;
    } catch (err) {
      isScanning = false;
      hasCameraPermission = false;
      scannerError = "Camera access denied or not available";
      console.error("Scanner error:", err);
    }
  }

  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
        html5QrCode = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    isScanning = false;
  }

  export function start() {
    startScanner();
  }

  export function stop() {
    stopScanner();
  }

  $effect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  });
</script>

<div id={containerId} class="relative h-full w-full {className}">
  {#if !isScanning && scannerError}
    <div
      class="bg-muted absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
    >
      <CameraOffIcon class="text-muted-foreground size-8" />
      <p class="text-muted-foreground text-sm">{scannerError}</p>
      <Button variant="outline" size="sm" onclick={startScanner}>Try Again</Button>
    </div>
  {:else if !isScanning}
    <div class="bg-muted absolute inset-0 flex flex-col items-center justify-center gap-2">
      <Loader2Icon class="size-6 animate-spin" />
      <p class="text-muted-foreground text-sm">Starting camera...</p>
    </div>
  {/if}
</div>

