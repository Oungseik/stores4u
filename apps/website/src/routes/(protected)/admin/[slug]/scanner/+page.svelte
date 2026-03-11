<script lang="ts">
  import CameraOffIcon from "@lucide/svelte/icons/camera-off";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as ScrollArea from "@repo/ui/scroll-area";
  import { Html5Qrcode } from "html5-qrcode";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";

  import { browser } from "$app/environment";

  const dockHeight = "80px";
  const scannerHeight = "220px";

  interface CartItem {
    id: string;
    barcode: string;
    name: string;
    priceCents: number;
    quantity: number;
    image: string | null;
  }

  // TODO: Replace with orpc.products.getByBarcode when API is ready
  const mockProducts: Array<{
    id: string;
    barcode: string;
    name: string;
    priceCents: number;
    image: string | null;
  }> = [
    { id: "1", barcode: "1234567890123", name: "Coffee Beans 250g", priceCents: 1299, image: null },
    { id: "2", barcode: "2345678901234", name: "Green Tea Box", priceCents: 849, image: null },
    { id: "3", barcode: "3456789012345", name: "Chocolate Bar", priceCents: 399, image: null },
    {
      id: "4",
      barcode: "4567890123456",
      name: "Sandwich Ham & Cheese",
      priceCents: 699,
      image: null,
    },
    { id: "5", barcode: "5678901234567", name: "Water Bottle 500ml", priceCents: 199, image: null },
    { id: "6", barcode: "6789012345678", name: "Apple Juice 1L", priceCents: 450, image: null },
    { id: "7", barcode: "7890123456789", name: "Banana Bunch", priceCents: 299, image: null },
    { id: "8", barcode: "8901234567890", name: "Bread Loaf", priceCents: 350, image: null },
  ];

  let cart = $state<CartItem[]>([]);
  let isScanning = $state(false);
  let hasCameraPermission = $state<boolean | null>(null);
  let scannerError = $state<string | null>(null);

  let html5QrCode: Html5Qrcode | null = null;
  let scannerContainerId = "barcode-scanner";

  const totalCents = $derived(cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0));
  const totalItems = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));

  function formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(2)}`;
  }

  function findProductByBarcode(barcode: string) {
    return mockProducts.find((p) => p.barcode === barcode);
  }

  function addToCart(barcode: string) {
    const product = findProductByBarcode(barcode);
    if (!product) {
      toast.error(`Product not found: ${barcode}`);
      return;
    }

    const existingItem = cart.find((item) => item.barcode === barcode);
    if (existingItem) {
      cart = cart.map((item) =>
        item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
      );
      toast.success(`Added another ${product.name}`);
    } else {
      cart = [
        ...cart,
        {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          priceCents: product.priceCents,
          quantity: 1,
          image: product.image,
        },
      ];
      toast.success(`Added ${product.name} to cart`);
    }
  }

  function increaseQuantity(barcode: string) {
    cart = cart.map((item) =>
      item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
    );
  }

  function decreaseQuantity(barcode: string) {
    const item = cart.find((i) => i.barcode === barcode);
    if (item && item.quantity <= 1) {
      removeFromCart(barcode);
    } else {
      cart = cart.map((i) => (i.barcode === barcode ? { ...i, quantity: i.quantity - 1 } : i));
    }
  }

  function removeFromCart(barcode: string) {
    const item = cart.find((i) => i.barcode === barcode);
    cart = cart.filter((i) => i.barcode !== barcode);
    if (item) {
      toast.success(`Removed ${item.name}`);
    }
  }

  async function startScanner() {
    try {
      html5QrCode = new Html5Qrcode(scannerContainerId);
      isScanning = true;
      scannerError = null;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          addToCart(decodedText);
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

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // TODO: Implement checkout logic
    toast.success(`Checkout: ${totalItems} items for ${formatPrice(totalCents)}`);
  }

  $effect(() => {
    if (!browser) return;

    async function initScanner() {
      await tick();
      const element = document.getElementById(scannerContainerId);
      if (!element) {
        console.error("Scanner container not found");
        return;
      }
      await startScanner();
    }

    initScanner();

    return () => {
      stopScanner();
    };
  });
</script>

<div class="bg-background flex h-full flex-col">
  <div class="shrink-0 overflow-hidden border-b-4" style="height: {scannerHeight};">
    <div id={scannerContainerId} class="relative h-full w-full">
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
  </div>

  <!-- <div class="flex items-center justify-between border-b px-4 py-2"> -->
  <!--   <div class="flex items-center gap-2"> -->
  <!--     <ScanLineIcon class="text-primary size-4" /> -->
  <!--     <span class="text-sm font-medium">Scan products to add</span> -->
  <!--   </div> -->
  <!--   <Button -->
  <!--     variant="ghost" -->
  <!--     size="sm" -->
  <!--     onclick={() => { -->
  <!--       if (isScanning) { -->
  <!--         stopScanner(); -->
  <!--       } else { -->
  <!--         startScanner(); -->
  <!--       } -->
  <!--     }} -->
  <!--   > -->
  <!--     {isScanning ? "Stop Scanner" : "Start Scanner"} -->
  <!--   </Button> -->
  <!-- </div> -->

  <div
    class="flex-1 overflow-hidden"
    style="height: calc(100% - {scannerHeight} - {dockHeight} - 49px);"
  >
    <ScrollArea.Root class="h-full">
      {#if cart.length === 0}
        <div class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="bg-muted flex size-16 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-muted-foreground size-8" />
          </div>
          <p class="font-medium">Cart is empty</p>
          <p class="text-muted-foreground text-sm">Scan barcodes to add products</p>
        </div>
      {:else}
        <div class="space-y-1.5 p-4">
          {#each cart as item (item.barcode)}
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <div
                    class="bg-muted flex size-12 shrink-0 items-center justify-center rounded-md"
                  >
                    {#if item.image}
                      <img
                        src={item.image}
                        alt={item.name}
                        class="size-full rounded-md object-cover"
                      />
                    {:else}
                      <PackageIcon class="text-muted-foreground size-5" />
                    {/if}
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{item.name}</p>
                    <p class="text-muted-foreground text-xs">{item.barcode}</p>
                  </div>

                  <div class="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      class="size-7"
                      onclick={() => decreaseQuantity(item.barcode)}
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon class="size-3" />
                    </Button>
                    <span class="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      class="size-7"
                      onclick={() => increaseQuantity(item.barcode)}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon class="size-3" />
                    </Button>
                  </div>

                  <p class="w-16 text-right text-sm font-semibold">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-destructive size-8"
                    onclick={() => removeFromCart(item.barcode)}
                    aria-label="Remove item"
                  >
                    <Trash2Icon class="size-4" />
                  </Button>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </ScrollArea.Root>
  </div>

  <div
    class="bg-card sticky right-0 bottom-0 left-0 border-t shadow-lg"
    style="height: {dockHeight};"
  >
    <div class="flex h-full items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <ShoppingCartIcon class="text-primary size-5" />
          </div>
          <div>
            <p class="text-muted-foreground text-xs">Total ({totalItems} items)</p>
            <p class="text-lg font-bold">{formatPrice(totalCents)}</p>
          </div>
        </div>
      </div>

      <Button class="gap-2 px-6" onclick={handleCheckout} disabled={cart.length === 0}>
        Checkout
      </Button>
    </div>
  </div>
</div>
