<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import Edit2Icon from "@lucide/svelte/icons/edit-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Popover from "@repo/ui/popover";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Separator } from "@repo/ui/separator";
  import { Switch } from "@repo/ui/switch";
  import { Textarea } from "@repo/ui/textarea";
  import { tick } from "svelte";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // Mock suppliers
  const suppliers = [
    {
      id: "sup-1",
      name: "Tech Supplies Co.",
      contact: "John Smith",
      phone: "+1 555-0123",
      email: "john@techsupplies.com",
      address: "123 Tech Street, Silicon Valley, CA",
    },
    {
      id: "sup-2",
      name: "Office Depot",
      contact: "Sarah Johnson",
      phone: "+1 555-0456",
      email: "sarah@officedepot.com",
      address: "456 Office Ave, Business City, NY",
    },
    {
      id: "sup-3",
      name: "Global Electronics",
      contact: "Mike Chen",
      phone: "+1 555-0789",
      email: "mike@globalelec.com",
      address: "789 Global Blvd, Electronics Town, TX",
    },
    {
      id: "sup-4",
      name: "Stationery Plus",
      contact: "Emily Brown",
      phone: "+1 555-0321",
      email: "emily@stationeryplus.com",
      address: "321 Stationery Lane, Paper City, FL",
    },
    {
      id: "sup-5",
      name: "Computer World",
      contact: "David Lee",
      phone: "+1 555-0654",
      email: "david@computerworld.com",
      address: "654 Computer Way, Digital City, WA",
    },
  ];

  // Mock products for search
  const products = [
    { id: "prod-1", name: "Wireless Mouse", sku: "MOU-001", priceCents: 4999 },
    { id: "prod-2", name: "Mechanical Keyboard", sku: "KEY-002", priceCents: 12999 },
    { id: "prod-3", name: "USB-C Cable", sku: "USB-003", priceCents: 1299 },
    { id: "prod-4", name: "Laptop Stand", sku: "STD-001", priceCents: 5999 },
    { id: "prod-5", name: "Webcam HD", sku: "CAM-001", priceCents: 8999 },
    { id: "prod-6", name: "USB Stick 64GB", sku: "USB-064", priceCents: 2499 },
    { id: "prod-7", name: "USB Stick 128GB", sku: "USB-128", priceCents: 3999 },
    { id: "prod-8", name: "External Hard Drive 1TB", sku: "HDD-001", priceCents: 6999 },
    { id: "prod-9", name: 'Monitor 24"', sku: "MON-024", priceCents: 19999 },
    { id: "prod-10", name: 'Monitor 27"', sku: "MON-027", priceCents: 29999 },
  ];

  // OCR Extracted Data (Mock)
  let invoiceData = $state({
    invoiceNumber: "INV-2025-0892",
    invoiceDate: "2025-01-15",
    supplierName: "Tech Supplies Co.",
    supplierId: "sup-1",
    subtotalCents: 125000,
    vatCents: 10000,
    discountCents: 5000,
    freightCents: 2000,
    totalCents: 132000,
    notes: "",
    isExistingSupplier: true,
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Wireless Mouse",
        qty: 10,
        unitCostCents: 3500,
        lineTotalCents: 35000,
      },
      {
        id: "item-2",
        productId: "prod-2",
        productName: "Mechanical Keyboard",
        qty: 5,
        unitCostCents: 9000,
        lineTotalCents: 45000,
      },
      {
        id: "item-3",
        productId: "prod-3",
        productName: "USB-C Cable",
        qty: 20,
        unitCostCents: 899,
        lineTotalCents: 17980,
      },
      {
        id: "item-4",
        productId: "prod-4",
        productName: "Laptop Stand",
        qty: 8,
        unitCostCents: 4000,
        lineTotalCents: 32000,
      },
    ],
  });

  // UI State
  let editingField = $state<string | null>(null);
  let supplierOpen = $state(false);
  let productSearchOpen = $state<string | null>(null);
  let tempValue = $state("");
  let selectedSupplier = $state(suppliers[0]);
  let isSubmitting = $state(false);
  let showNewSupplierForm = $state(false);

  // New supplier form
  let newSupplier = $state({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });

  function startEditing(field: string, value: string) {
    editingField = field;
    tempValue = value;
    tick().then(() => {
      const input = document.getElementById(`edit-${field}`) as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  function saveField(field: string) {
    const keys = field.split(".");
    if (keys.length === 1) {
      (invoiceData as any)[keys[0]] = tempValue;
    } else if (keys.length === 3 && keys[0] === "items") {
      const itemIndex = Number.parseInt(keys[1]);
      const itemField = keys[2];
      if (itemField === "qty" || itemField === "unitCostCents") {
        invoiceData.items[itemIndex][itemField as "qty" | "unitCostCents"] =
          Number.parseFloat(tempValue) || 0;
        // Recalculate line total
        invoiceData.items[itemIndex].lineTotalCents =
          invoiceData.items[itemIndex].qty * invoiceData.items[itemIndex].unitCostCents;
      } else {
        (invoiceData.items[itemIndex] as any)[itemField] = tempValue;
      }
      // Recalculate totals
      recalculateTotals();
    }
    editingField = null;
  }

  function cancelEditing() {
    editingField = null;
    tempValue = "";
  }

  function handleKeyDown(e: KeyboardEvent, field: string) {
    if (e.key === "Enter") {
      saveField(field);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  function selectSupplier(supplier: (typeof suppliers)[0]) {
    selectedSupplier = supplier;
    invoiceData.supplierId = supplier.id;
    invoiceData.supplierName = supplier.name;
    supplierOpen = false;
  }

  function selectProduct(itemId: string, product: (typeof products)[0]) {
    const item = invoiceData.items.find((i) => i.id === itemId);
    if (item) {
      item.productId = product.id;
      item.productName = product.name;
    }
    productSearchOpen = null;
  }

  function addItem() {
    invoiceData.items = [
      ...invoiceData.items,
      {
        id: `item-${Date.now()}`,
        productId: "",
        productName: "",
        qty: 1,
        unitCostCents: 0,
        lineTotalCents: 0,
      },
    ];
    recalculateTotals();
  }

  function removeItem(itemId: string) {
    invoiceData.items = invoiceData.items.filter((i) => i.id !== itemId);
    recalculateTotals();
  }

  function recalculateTotals() {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    invoiceData.subtotalCents = subtotal;
    invoiceData.totalCents =
      subtotal + invoiceData.vatCents - invoiceData.discountCents + invoiceData.freightCents;
  }

  function saveNewSupplier() {
    // Mock: Add new supplier
    const supplier = {
      id: `sup-${Date.now()}`,
      ...newSupplier,
    };
    selectedSupplier = supplier;
    invoiceData.supplierId = supplier.id;
    invoiceData.supplierName = supplier.name;
    showNewSupplierForm = false;
    newSupplier = { name: "", contact: "", phone: "", email: "", address: "" };
  }

  async function validateAndSave() {
    isSubmitting = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isSubmitting = false;
    alert("Invoice validated and inventory updated successfully!");
  }

  function formatCents(cents: number) {
    return `${(cents / 100).toFixed(2)}`;
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Review Invoice" },
    ]}
  />

  <!-- Page Title -->
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Review Invoice</h1>
        <p class="text-muted-foreground text-sm">Verify extracted data before saving</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => history.back()}>
          <XIcon class="size-4" />
          Cancel
        </Button>
        <Button onclick={validateAndSave} disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2Icon class="size-4 animate-spin" />
            Saving...
          {:else}
            <CheckIcon class="size-4" />
            Validate & Save
          {/if}
        </Button>
      </div>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Left: Invoice Preview -->
    <Card.Root class="h-fit lg:col-start-2 lg:col-end-3 lg:row-start-1">
      <Card.Header>
        <Card.Title>Invoice Preview</Card.Title>
        <Card.Description>Original document uploaded</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="bg-muted flex aspect-[3/4] items-center justify-center rounded-lg border">
          <div class="text-muted-foreground flex flex-col items-center gap-2">
            <CreditCardIcon class="size-12" />
            <p class="text-sm">Invoice Image Preview</p>
            <p class="text-xs">INV-2025-0892</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Right: Data Review -->
    <div class="flex flex-col gap-6 lg:col-start-1 lg:col-end-2 lg:row-start-1">
      <!-- Supplier Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Building2Icon class="size-4" />
            Supplier Information
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <!-- Supplier Toggle -->
          <div class="flex items-center gap-4">
            <Switch
              id="existing-supplier"
              checked={invoiceData.isExistingSupplier}
              onCheckedChange={(v) => (invoiceData.isExistingSupplier = v)}
            />
            <Label for="existing-supplier">
              {invoiceData.isExistingSupplier ? "Existing Supplier" : "Create New Supplier"}
            </Label>
          </div>

          {#if invoiceData.isExistingSupplier}
            <!-- Existing Supplier Search -->
            <Popover.Root bind:open={supplierOpen}>
              <Popover.Trigger
                class={buttonVariants({ variant: "outline", class: "w-full justify-between" })}
              >
                <span class="truncate">{selectedSupplier?.name || "Select supplier..."}</span>
                <ChevronDownIcon class="size-4 opacity-50" />
              </Popover.Trigger>
              <Popover.Content class="w-80 p-0" align="start">
                <Command.Root>
                  <Command.Input placeholder="Search suppliers..." />
                  <Command.List>
                    <Command.Empty>No suppliers found.</Command.Empty>
                    {#each suppliers as supplier}
                      <Command.Item value={supplier.name} onSelect={() => selectSupplier(supplier)}>
                        <CheckIcon
                          class={[
                            "size-4",
                            selectedSupplier?.id !== supplier.id && "text-transparent",
                          ]}
                        />
                        <div class="flex flex-col">
                          <span>{supplier.name}</span>
                          <span class="text-muted-foreground text-xs">{supplier.contact}</span>
                        </div>
                      </Command.Item>
                    {/each}
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>

            {#if selectedSupplier}
              <div class="bg-background rounded-lg border p-4 shadow-sm">
                <div class="mb-3 flex items-start gap-3">
                  <div
                    class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
                  >
                    <Building2Icon class="size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">{selectedSupplier.name}</p>
                    <p class="text-muted-foreground text-xs">{selectedSupplier.id}</p>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center gap-2 text-sm">
                    <div
                      class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                    >
                      <UserIcon class="size-3.5" />
                    </div>
                    <span class="truncate">{selectedSupplier.contact}</span>
                  </div>

                  <div class="flex items-center gap-2 text-sm">
                    <div
                      class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                    >
                      <PhoneIcon class="size-3.5" />
                    </div>
                    <span class="truncate">{selectedSupplier.phone}</span>
                  </div>

                  <div class="flex items-center gap-2 text-sm">
                    <div
                      class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                    >
                      <MailIcon class="size-3.5" />
                    </div>
                    <span class="text-primary truncate">{selectedSupplier.email}</span>
                  </div>

                  <div class="flex items-center gap-2 text-sm">
                    <div
                      class="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded"
                    >
                      <MapPinIcon class="size-3.5" />
                    </div>
                    <span class="text-muted-foreground text-sm leading-relaxed"
                      >{selectedSupplier.address}</span
                    >
                  </div>
                </div>
              </div>
            {/if}
          {:else}
            <!-- New Supplier Form -->
            <div class="grid gap-3">
              <div class="grid gap-2">
                <Label for="new-supplier-name">Supplier Name</Label>
                <Input
                  id="new-supplier-name"
                  bind:value={newSupplier.name}
                  placeholder="Enter supplier name"
                />
              </div>
              <div class="grid gap-2">
                <Label for="new-supplier-contact">Contact Person</Label>
                <Input
                  id="new-supplier-contact"
                  bind:value={newSupplier.contact}
                  placeholder="Enter contact name"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="grid gap-2">
                  <Label for="new-supplier-phone">Phone</Label>
                  <Input
                    id="new-supplier-phone"
                    bind:value={newSupplier.phone}
                    placeholder="+1 555-0000"
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="new-supplier-email">Email</Label>
                  <Input
                    id="new-supplier-email"
                    bind:value={newSupplier.email}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div class="grid gap-2">
                <Label for="new-supplier-address">Address</Label>
                <Textarea
                  id="new-supplier-address"
                  bind:value={newSupplier.address}
                  placeholder="Enter address"
                />
              </div>
              <Button variant="secondary" onclick={saveNewSupplier} disabled={!newSupplier.name}>
                <PlusIcon class="size-4" />
                Add Supplier
              </Button>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Invoice Details -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Invoice Details</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Invoice Number -->
            <div class="grid gap-2">
              <Label>Invoice Number</Label>
              {#if editingField === "invoiceNumber"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-invoiceNumber"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "invoiceNumber")}
                    onblur={() => saveField("invoiceNumber")}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("invoiceNumber")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <div
                  class="hover:bg-muted flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                  onclick={() => startEditing("invoiceNumber", invoiceData.invoiceNumber)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) =>
                    e.key === "Enter" && startEditing("invoiceNumber", invoiceData.invoiceNumber)}
                >
                  <span>{invoiceData.invoiceNumber}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </div>
              {/if}
            </div>

            <!-- Invoice Date -->
            <div class="grid gap-2">
              <Label>Invoice Date</Label>
              {#if editingField === "invoiceDate"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-invoiceDate"
                    type="date"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "invoiceDate")}
                    onblur={() => saveField("invoiceDate")}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("invoiceDate")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <div
                  class="hover:bg-muted flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                  onclick={() => startEditing("invoiceDate", invoiceData.invoiceDate)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) =>
                    e.key === "Enter" && startEditing("invoiceDate", invoiceData.invoiceDate)}
                >
                  <span>{invoiceData.invoiceDate}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </div>
              {/if}
            </div>
          </div>

          <!-- Totals -->
          <div class="space-y-2 rounded-lg border p-4">
            <!-- Subtotal -->
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              {#if editingField === "subtotalCents"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-subtotalCents"
                    type="number"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "subtotalCents")}
                    onblur={() => saveField("subtotalCents")}
                    class="w-32 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("subtotalCents")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <Button
                  variant="ghost"
                  onclick={() =>
                    startEditing("subtotalCents", invoiceData.subtotalCents.toString())}
                >
                  <span>{formatCents(invoiceData.subtotalCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

            <!-- VAT -->
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">VAT</span>
              {#if editingField === "vatCents"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-vatCents"
                    type="number"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "vatCents")}
                    onblur={() => saveField("vatCents")}
                    class="w-32 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("vatCents")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <Button
                  variant="ghost"
                  onclick={() => startEditing("vatCents", invoiceData.vatCents.toString())}
                >
                  <span>{formatCents(invoiceData.vatCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

            <!-- Discount -->
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Discount</span>
              {#if editingField === "discountCents"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-discountCents"
                    type="number"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "discountCents")}
                    onblur={() => saveField("discountCents")}
                    class="w-32 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("discountCents")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <Button
                  variant="ghost"
                  onclick={() =>
                    startEditing("discountCents", invoiceData.discountCents.toString())}
                >
                  <span>-{formatCents(invoiceData.discountCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

            <!-- Freight -->
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Freight</span>
              {#if editingField === "freightCents"}
                <div class="flex items-center gap-2">
                  <Input
                    id="edit-freightCents"
                    type="number"
                    bind:value={tempValue}
                    onkeydown={(e) => handleKeyDown(e, "freightCents")}
                    onblur={() => saveField("freightCents")}
                    class="w-32 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    onclick={() => saveField("freightCents")}
                  >
                    <CheckIcon class="size-4" />
                  </Button>
                </div>
              {:else}
                <Button
                  variant="ghost"
                  onclick={() => startEditing("freightCents", invoiceData.freightCents.toString())}
                >
                  <span>{formatCents(invoiceData.freightCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

            <Separator />

            <!-- Total -->
            <div class="flex items-center justify-between">
              <span class="font-semibold">Total</span>
              <span class="text-lg font-bold">
                <Pricing cents={invoiceData.totalCents} country={shop.country} />
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div class="grid gap-2">
            <Label for="notes">Notes</Label>
            <Textarea
              id="notes"
              bind:value={invoiceData.notes}
              placeholder="Add any additional notes..."
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Items Table -->
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between">
          <Card.Title class="flex items-center gap-2">
            <PackageIcon class="size-4" />
            Items ({invoiceData.items.length})
          </Card.Title>
          <Button variant="outline" size="sm" onclick={addItem}>
            <PlusIcon class="size-4" />
            Add Item
          </Button>
        </Card.Header>
        <Card.Content class="p-0">
          <ScrollArea class="max-h-96">
            <table class="w-full text-sm">
              <thead class="bg-muted sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left font-medium">Product</th>
                  <th class="w-24 px-4 py-3 text-center font-medium">Qty</th>
                  <th class="w-32 px-4 py-3 text-right font-medium">Unit Cost</th>
                  <th class="w-32 px-4 py-3 text-right font-medium">Total</th>
                  <th class="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {#each invoiceData.items as item, index}
                  <tr class="hover:bg-muted/50 border-b last:border-b-0">
                    <!-- Product -->
                    <td class="px-4 py-2">
                      {#if productSearchOpen === item.id}
                        <Popover.Root open={true}>
                          <Popover.Trigger class="w-full">
                            <div class="flex items-center gap-2">
                              <Input
                                placeholder="Search products..."
                                class="w-full"
                                autofocus
                                oninput={(e) => {
                                  const value = e.currentTarget.value;
                                  if (value.length > 0) {
                                    // Filter products (in real app, this would be debounced)
                                  }
                                }}
                              />
                            </div>
                          </Popover.Trigger>
                          <Popover.Content class="w-80 p-0" align="start">
                            <Command.Root>
                              <Command.Input placeholder="Search products..." />
                              <Command.List>
                                <Command.Empty>No products found.</Command.Empty>
                                {#each products as product}
                                  <Command.Item
                                    value={product.name}
                                    onSelect={() => selectProduct(item.id, product)}
                                  >
                                    <div class="flex flex-col">
                                      <span>{product.name}</span>
                                      <span class="text-muted-foreground text-xs"
                                        >{product.sku}</span
                                      >
                                    </div>
                                  </Command.Item>
                                {/each}
                              </Command.List>
                            </Command.Root>
                          </Popover.Content>
                        </Popover.Root>
                      {:else}
                        <div
                          class="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1"
                          onclick={() => (productSearchOpen = item.id)}
                          role="button"
                          tabindex="0"
                          onkeydown={(e) => e.key === "Enter" && (productSearchOpen = item.id)}
                        >
                          {#if item.productId}
                            <div class="flex flex-col">
                              <span class="font-medium">{item.productName}</span>
                              <span class="text-muted-foreground text-xs">{item.productId}</span>
                            </div>
                          {:else}
                            <span class="text-muted-foreground italic">Click to search...</span>
                          {/if}
                        </div>
                      {/if}
                    </td>

                    <!-- Qty -->
                    <td class="px-4 py-2">
                      {#if editingField === `items.${index}.qty`}
                        <Input
                          id={`edit-items.${index}.qty`}
                          type="number"
                          bind:value={tempValue}
                          onkeydown={(e) => handleKeyDown(e, `items.${index}.qty`)}
                          onblur={() => saveField(`items.${index}.qty`)}
                          class="w-20 text-center"
                        />
                      {:else}
                        <Button
                          variant="ghost"
                          onclick={() => startEditing(`items.${index}.qty`, item.qty.toString())}
                        >
                          {item.qty}
                        </Button>
                      {/if}
                    </td>

                    <!-- Unit Cost -->
                    <td class="px-4 py-2 text-right">
                      {#if editingField === `items.${index}.unitCostCents`}
                        <Input
                          id={`edit-items.${index}.unitCostCents`}
                          type="number"
                          bind:value={tempValue}
                          onkeydown={(e) => handleKeyDown(e, `items.${index}.unitCostCents`)}
                          onblur={() => saveField(`items.${index}.unitCostCents`)}
                          class="w-28 text-right"
                        />
                      {:else}
                        <Button
                          variant="ghost"
                          onclick={() =>
                            startEditing(
                              `items.${index}.unitCostCents`,
                              item.unitCostCents.toString()
                            )}
                        >
                          {formatCents(item.unitCostCents)}
                        </Button>
                      {/if}
                    </td>

                    <!-- Total -->
                    <td class="px-4 py-2 text-right font-medium">
                      {formatCents(item.lineTotalCents)}
                    </td>

                    <!-- Remove -->
                    <td class="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-8 text-red-500 hover:text-red-700"
                        onclick={() => removeItem(item.id)}
                      >
                        <Trash2Icon class="size-4" />
                      </Button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </ScrollArea>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
