<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button } from "@repo/ui/button";
  import { Html5Qrcode } from "html5-qrcode";
  import { tick } from "svelte";

  import { browser } from "$app/environment";
  import { createBarcodeScanFilter } from "./scan-filter";

  interface Props {
    containerId?: string;
    onScan?: (barcode: string) => void;
    class?: string;
    enabled?: boolean;
  }

  let {
    containerId = "barcode-scanner",
    onScan,
    class: className = "",
    enabled = true,
  }: Props = $props();

  let isScanning = $state(false);
  let scannerError = $state<string | null>(null);
  let isPermissionError = $state(false);
  let html5QrCode: Html5Qrcode | null = null;
  const acceptScan = createBarcodeScanFilter();

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
      isPermissionError = false;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.min(250, Math.floor(viewfinderWidth * 0.8)),
            height: Math.min(80, Math.floor(viewfinderHeight * 0.6)),
          }),
        },
        (decodedText) => {
          if (acceptScan(decodedText)) onScan?.(decodedText);
        },
        () => {},
      );
    } catch (err) {
      isScanning = false;
      isPermissionError =
        err === "Error getting userMedia, error = NotAllowedError: Permission denied";
      scannerError = isPermissionError
        ? msg.ui_camera_permission_required_to_scan_barcodes_allow_camer()
        : msg.ui_camera_access_denied_or_not_available();
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
    if (enabled) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  });
</script>

{#if !isScanning && scannerError}
  <div class="relative w-full {className}">
    <div
      class="bg-muted absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
    >
      <CameraOffIcon class="text-muted-foreground size-8" />
      <p class="text-muted-foreground text-sm">{scannerError}</p>
      {#if !isPermissionError}
        <Button variant="outline" size="sm" onclick={startScanner}>{msg.ui_try_again()}</Button>
      {/if}
    </div>
  </div>
{:else}
  <div id={containerId} class="scanner-viewport relative w-full {className}">
    {#if !isScanning}
      <div class="bg-muted absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Loader2Icon class="size-6 animate-spin" />
        <p class="text-muted-foreground text-sm">{msg.ui_starting_camera()}</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .scanner-viewport :global(video) {
    height: 100%;
    object-fit: cover;
  }
</style>
