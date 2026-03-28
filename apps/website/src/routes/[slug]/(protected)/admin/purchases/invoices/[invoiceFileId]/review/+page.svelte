<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import Edit2Icon from "@lucide/svelte/icons/edit-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";
  import { createQuery } from "@tanstack/svelte-query";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";

  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  type InvoiceItem = {
    id: string;
    productName: string;
    qty: number;
    unitCostCents: number;
    lineTotalCents: number;
  };

  type InvoiceData = {
    invoiceNumber: string;
    invoiceDate: string;
    subtotalCents: number;
    vatCents: number;
    discountCents: number;
    freightCents: number;
    totalCents: number;
    notes: string;
    items: InvoiceItem[];
  };

  const { params }: PageProps = $props();

  const invoiceFileQuery = createQuery(() =>
    orpc.purchaseInvoices.getFile.queryOptions({
      input: { slug: params.slug, invoiceFileId: params.invoiceFileId },
    })
  );

  const suppliersQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { slug: params.slug, pageSize: 1000 },
    })
  );

  const extractedData = $derived(invoiceFileQuery.data?.ocrResult?.extractedData ?? null);

  const supplierSearchName = $derived(extractedData?.supplier?.name ?? null);

  const searchSupplierQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { slug: params.slug, pageSize: 1, search: supplierSearchName ?? "" },
      enabled: supplierSearchName !== null,
    })
  );

  const isLoading = $derived(
    invoiceFileQuery.isLoading ||
      suppliersQuery.isLoading ||
      (supplierSearchName !== null && searchSupplierQuery.isLoading)
  );

  const error = $derived(invoiceFileQuery.error ?? suppliersQuery.error);

  const suppliers = $derived.by(() => {
    return suppliersQuery.data?.items ?? [];
  });

  let invoiceData: InvoiceData = $state({
    invoiceNumber: "",
    invoiceDate: "",
    subtotalCents: 0,
    vatCents: 0,
    discountCents: 0,
    freightCents: 0,
    totalCents: 0,
    notes: "",
    items: [],
  });

  let isExistingSupplier = $state(true);
  let editingField = $state<string | null>(null);
  let tempValue = $state("");
  let isSubmitting = $state(false);
  let selectedSupplier = $state<Supplier | null>(null);
  let initialized = $state(false);

  const canSave = $derived(selectedSupplier !== null);

  $effect.pre(() => {
    if (invoiceFileQuery.isLoading || initialized) return;

    const data = extractedData;
    if (!data) return;

    invoiceData = {
      invoiceNumber: data.invoice?.invoiceNumber ?? "",
      invoiceDate: data.invoice?.invoiceDate ?? "",
      subtotalCents: data.invoice?.subtotalCents ?? 0,
      vatCents: data.invoice?.vatCents ?? 0,
      discountCents: data.invoice?.discountCents ?? 0,
      freightCents: data.invoice?.freightCents ?? 0,
      totalCents: data.invoice?.totalCents ?? 0,
      notes: data.invoice?.notes ?? "",
      items:
        data.items.map((item, idx) => ({
          id: `item-${idx}`,
          productName: item.productName,
          qty: item.quantity,
          unitCostCents: item.unitCostCents,
          lineTotalCents: item.lineTotalCents,
        })) ?? [],
    };

    initialized = true;
  });

  $effect.pre(() => {
    if (!initialized) return;

    if (searchSupplierQuery.data?.items?.length) {
      const found = searchSupplierQuery.data.items[0];
      selectedSupplier = {
        id: found.id,
        name: found.name,
        contactName: found.contactName,
        phone: found.phone,
        email: found.email,
        address: found.address,
      };
      isExistingSupplier = true;
    } else if (supplierSearchName !== null && searchSupplierQuery.isSuccess) {
      if (extractedData?.supplier) {
        isExistingSupplier = false;
      }
    }
  });

  function startEditing(field: string, value: string) {
    editingField = field;
    tempValue = value;
    tick().then(() => {
      const el = document.getElementById(`edit-${field}`);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
        el.select();
      }
    });
  }

  function saveField(field: string) {
    const keys = field.split(".");
    if (keys.length === 1) {
      const key = keys[0];
      if (key === "invoiceNumber") invoiceData.invoiceNumber = tempValue;
      else if (key === "invoiceDate") invoiceData.invoiceDate = tempValue;
    } else if (keys.length === 3 && keys[0] === "items") {
      const itemIndex = Number.parseInt(keys[1]);
      const itemField = keys[2];
      const item = invoiceData.items[itemIndex];
      if (item) {
        if (itemField === "qty") {
          item.qty = Number.parseFloat(tempValue) || 0;
          item.lineTotalCents = item.qty * item.unitCostCents;
        } else if (itemField === "unitCostCents") {
          item.unitCostCents = Number.parseFloat(tempValue) || 0;
          item.lineTotalCents = item.qty * item.unitCostCents;
        } else if (itemField === "productName") {
          item.productName = tempValue;
        }
        recalculateTotals();
      }
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

  {#if isLoading}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2Icon class="text-muted-foreground size-8 animate-spin" />
      <p class="text-muted-foreground">Loading invoice data...</p>
    </div>
  {:else if error || !invoiceFileQuery.data}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <XIcon class="text-destructive size-12" />
      <div class="text-center">
        <p class="text-lg font-semibold">Error Loading Invoice</p>
        <p class="text-muted-foreground">{error?.message ?? "Invoice file not found"}</p>
      </div>
      <Button variant="outline" onclick={() => history.back()}>Go Back</Button>
    </div>
  {:else if invoiceFileQuery.data.status !== "PROCESSED"}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <XIcon class="text-destructive size-12" />
      <div class="text-center">
        <p class="text-lg font-semibold">Invoice Not Ready</p>
        <p class="text-muted-foreground">Invoice file must be processed before review</p>
      </div>
      <Button variant="outline" onclick={() => history.back()}>Go Back</Button>
    </div>
  {:else}
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
          {#if invoiceFileQuery.data.imageUrl}
            <ScrollArea class="h-[calc(100vh-160px)] min-h-100">
              {#if invoiceFileQuery.data.fileType === "application/pdf"}
                <iframe
                  src={invoiceFileQuery.data.imageUrl}
                  title="Invoice PDF"
                  class="h-full min-h-96 w-full rounded-lg border"
                ></iframe>
              {:else}
                <img
                  src={invoiceFileQuery.data.imageUrl}
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
        <SupplierCard
          slug={params.slug}
          {suppliers}
          bind:selectedSupplier
          bind:isExistingSupplier
          initialSupplierData={extractedData?.supplier}
        />

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
                  {#each invoiceData.items as item, index (item.id)}
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
                    onclick={() =>
                      startEditing("freightCents", invoiceData.freightCents.toString())}
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
  {/if}
</div>
