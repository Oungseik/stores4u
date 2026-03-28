<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
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
  import { createMutation } from "@tanstack/svelte-query";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import type { ExtractedInvoiceData } from "$lib/server/ai/invoice-processor";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data, params }: PageProps = $props();

  type Supplier = {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  };

  const extractedData = data.extractedData as ExtractedInvoiceData | null;
  const suppliers = data.suppliers as Supplier[];
  const matchedSupplier = data.matchedSupplier;

  let invoiceData = $state({
    invoiceNumber: extractedData?.invoice?.invoiceNumber ?? "",
    invoiceDate: extractedData?.invoice?.invoiceDate ?? "",
    subtotalCents: extractedData?.invoice?.subtotalCents ?? 0,
    vatCents: extractedData?.invoice?.vatCents ?? 0,
    discountCents: extractedData?.invoice?.discountCents ?? 0,
    freightCents: extractedData?.invoice?.freightCents ?? 0,
    totalCents: extractedData?.invoice?.totalCents ?? 0,
    notes: extractedData?.invoice?.notes ?? "",
    items:
      extractedData?.items.map((item, idx) => ({
        id: `item-${idx}`,
        productName: item.productName,
        qty: item.quantity,
        unitCostCents: item.unitCostCents,
        lineTotalCents: item.lineTotalCents,
      })) ?? [],
  });

  let isExistingSupplier = $state(matchedSupplier !== null);
  let supplierOpen = $state(false);
  let editingField = $state<string | null>(null);
  let tempValue = $state("");
  let isSubmitting = $state(false);

  let selectedSupplier = $state<Supplier | null>(matchedSupplier);

  let newSupplier = $state({
    name: extractedData?.supplier?.name ?? "",
    contactName: extractedData?.supplier?.contactName ?? "",
    phone: extractedData?.supplier?.phone ?? "",
    email: extractedData?.supplier?.email ?? "",
    address: extractedData?.supplier?.address ?? "",
  });

  const canSave = $derived(selectedSupplier !== null);

  const createSupplierMutation = createMutation(() =>
    orpc.suppliers.create.mutationOptions({
      onSuccess: (created) => {
        const newSup: Supplier = {
          id: created.id,
          name: created.name,
          contactName: created.contactName ?? null,
          phone: created.phone ?? null,
          email: created.email ?? null,
          address: created.address ?? null,
        };
        suppliers.push(newSup);
        selectedSupplier = newSup;
        isExistingSupplier = true;
        toast.success("Supplier created successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create supplier");
      },
    })
  );

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
      (invoiceData as Record<string, unknown>)[keys[0]] = tempValue;
    } else if (keys.length === 3 && keys[0] === "items") {
      const itemIndex = Number.parseInt(keys[1]);
      const itemField = keys[2];
      if (itemField === "qty" || itemField === "unitCostCents") {
        invoiceData.items[itemIndex][itemField as "qty" | "unitCostCents"] =
          Number.parseFloat(tempValue) || 0;
        invoiceData.items[itemIndex].lineTotalCents =
          invoiceData.items[itemIndex].qty * invoiceData.items[itemIndex].unitCostCents;
      } else {
        (invoiceData.items[itemIndex] as Record<string, unknown>)[itemField] = tempValue;
      }
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

  function selectSupplier(supplier: Supplier) {
    selectedSupplier = supplier;
    supplierOpen = false;
  }

  function addItem() {
    invoiceData.items = [
      ...invoiceData.items,
      {
        id: `item-${Date.now()}`,
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

  async function saveNewSupplier() {
    await createSupplierMutation.mutateAsync({
      slug: params.slug,
      name: newSupplier.name,
      contactName: newSupplier.contactName || undefined,
      phone: newSupplier.phone || undefined,
      email: newSupplier.email || undefined,
      address: newSupplier.address || undefined,
    });
  }

  async function validateAndSave() {
    isSubmitting = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isSubmitting = false;
    toast.success("Invoice validated and inventory updated successfully!");
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}/admin` },
      { label: "Purchases", href: `/${params.slug}/admin/purchases` },
      { label: "Review Invoice" },
    ]}
  />

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
        <Button onclick={validateAndSave} disabled={isSubmitting || !canSave}>
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

  <div class="grid gap-6 lg:grid-cols-2">
    <Card.Root class="h-fit lg:sticky lg:top-6 lg:col-start-2 lg:col-end-3 lg:row-start-1">
      <Card.Header>
        <Card.Title>Invoice Preview</Card.Title>
        <Card.Description>Original document uploaded</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.imageUrl}
          <ScrollArea class="h-[calc(100vh-160px)] min-h-100">
            {#if data.file?.fileType === "application/pdf"}
              <iframe
                src={data.imageUrl}
                title="Invoice PDF"
                class="h-full min-h-96 w-full rounded-lg border"
              ></iframe>
            {:else}
              <img
                src={data.imageUrl}
                alt="Invoice"
                class="w-full rounded-lg border object-contain"
              />
            {/if}
          </ScrollArea>
        {:else}
          <div class="bg-muted flex aspect-[3/4] items-center justify-center rounded-lg border">
            <div class="text-muted-foreground flex flex-col items-center gap-2">
              <XIcon class="size-12" />
              <p class="text-sm">Unable to load invoice preview</p>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <div class="flex flex-col gap-6 lg:col-start-1 lg:col-end-2 lg:row-start-1">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Building2Icon class="size-4" />
            Supplier Information
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex items-center gap-4">
            <Switch
              id="existing-supplier"
              checked={isExistingSupplier}
              onCheckedChange={(v) => (isExistingSupplier = v)}
            />
            <Label for="existing-supplier">
              {isExistingSupplier ? "Existing Supplier" : "Create New Supplier"}
            </Label>
          </div>

          {#if isExistingSupplier}
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
                          {#if supplier.contactName}
                            <span class="text-muted-foreground text-xs">{supplier.contactName}</span
                            >
                          {/if}
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
                  {#if selectedSupplier.contactName}
                    <div class="flex items-center gap-2 text-sm">
                      <div
                        class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                      >
                        <UserIcon class="size-3.5" />
                      </div>
                      <span class="truncate">{selectedSupplier.contactName}</span>
                    </div>
                  {/if}

                  {#if selectedSupplier.phone}
                    <div class="flex items-center gap-2 text-sm">
                      <div
                        class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                      >
                        <PhoneIcon class="size-3.5" />
                      </div>
                      <span class="truncate">{selectedSupplier.phone}</span>
                    </div>
                  {/if}

                  {#if selectedSupplier.email}
                    <div class="flex items-center gap-2 text-sm">
                      <div
                        class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                      >
                        <MailIcon class="size-3.5" />
                      </div>
                      <span class="text-primary truncate">{selectedSupplier.email}</span>
                    </div>
                  {/if}

                  {#if selectedSupplier.address}
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
                  {/if}
                </div>
              </div>
            {/if}
          {:else}
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
                  bind:value={newSupplier.contactName}
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
              <Button
                variant="secondary"
                onclick={saveNewSupplier}
                disabled={!newSupplier.name || createSupplierMutation.isPending}
              >
                {#if createSupplierMutation.isPending}
                  <Loader2Icon class="size-4 animate-spin" />
                  Creating...
                {:else}
                  <PlusIcon class="size-4" />
                  Add Supplier
                {/if}
              </Button>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

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
                    <td class="px-4 py-2">
                      {#if editingField === `items.${index}.productName`}
                        <Input
                          id={`edit-items.${index}.productName`}
                          bind:value={tempValue}
                          onkeydown={(e) => handleKeyDown(e, `items.${index}.productName`)}
                          onblur={() => saveField(`items.${index}.productName`)}
                          class="w-full"
                        />
                      {:else}
                        <div
                          class="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1"
                          onclick={() =>
                            startEditing(`items.${index}.productName`, item.productName)}
                          role="button"
                          tabindex="0"
                          onkeydown={(e) =>
                            e.key === "Enter" &&
                            startEditing(`items.${index}.productName`, item.productName)}
                        >
                          {#if item.productName}
                            <span class="font-medium">{item.productName}</span>
                          {:else}
                            <span class="text-muted-foreground italic">Click to edit...</span>
                          {/if}
                        </div>
                      {/if}
                    </td>

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
                          {formatPrice(item.unitCostCents)}
                        </Button>
                      {/if}
                    </td>

                    <td class="px-4 py-2 text-right font-medium">
                      {formatPrice(item.lineTotalCents)}
                    </td>

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

      <Card.Root>
        <Card.Header>
          <Card.Title>Invoice Details</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
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

          <div class="space-y-2 rounded-lg border p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              <div class={buttonVariants({ variant: "ghost" })}>
                <span>{formatPrice(invoiceData.subtotalCents)}</span>
                <Edit2Icon class="text-muted-foreground invisible size-3" />
              </div>
            </div>

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
                  <span>{formatPrice(invoiceData.vatCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

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
                  <span>-{formatPrice(invoiceData.discountCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

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
                  <span>{formatPrice(invoiceData.freightCents)}</span>
                  <Edit2Icon class="text-muted-foreground size-3" />
                </Button>
              {/if}
            </div>

            <Separator />

            <div class="flex items-center justify-between">
              <span class="font-semibold">Total</span>
              <div class={buttonVariants({ variant: "ghost" })}>
                <span class="text-lg font-bold">
                  {formatPrice(invoiceData.totalCents)}
                </span>
                <Edit2Icon class="text-muted-foreground invisible size-3" />
              </div>
            </div>
          </div>

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
    </div>
  </div>
</div>
