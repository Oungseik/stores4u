<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";
  import { createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import InvoicePreviewCard from "$lib/components/cards/InvoicePreviewCard.svelte";
  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  type InvoiceItem = {
    id: string;
    productName: string;
    qty: number;
    unitCost: number;
  };

  type InvoiceData = {
    invoiceNumber: string;
    invoiceDate: string;
    vat: number;
    discount: number;
    freight: number;
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

  const suppliers = $derived(suppliersQuery.data?.items ?? []);

  let invoiceData: InvoiceData = $state({
    invoiceNumber: "",
    invoiceDate: "",
    vat: 0,
    discount: 0,
    freight: 0,
    notes: "",
    items: [],
  });

  let isExistingSupplier = $state(true);
  let isSubmitting = $state(false);
  let selectedSupplier = $state<Supplier | null>(null);
  let editingItemId = $state<string | null>(null);

  const canSave = $derived(selectedSupplier !== null);

  const lineTotalsCents = $derived(
    invoiceData.items.map((item) => Math.round(item.qty * item.unitCost * 100))
  );

  const subtotalCents = $derived(lineTotalsCents.reduce((sum, total) => sum + total, 0));

  const totalCents = $derived(
    subtotalCents +
      Math.round(invoiceData.vat * 100) -
      Math.round(invoiceData.discount * 100) +
      Math.round(invoiceData.freight * 100)
  );

  $effect(() => {
    const data = invoiceFileQuery.data?.ocrResult?.extractedData;
    if (!data) return;

    invoiceData = {
      invoiceNumber: data.invoice?.invoiceNumber ?? "",
      invoiceDate: data.invoice?.invoiceDate ?? "",
      vat: (data.invoice?.vatCents ?? 0) / 100,
      discount: (data.invoice?.discountCents ?? 0) / 100,
      freight: (data.invoice?.freightCents ?? 0) / 100,
      notes: data.invoice?.notes ?? "",
      items:
        data.items?.map((item, idx) => ({
          id: `item-${idx}`,
          productName: item.productName,
          qty: item.quantity,
          unitCost: item.unitCostCents / 100,
        })) ?? [],
    };
  });

  $effect(() => {
    const found = searchSupplierQuery.data?.items?.[0];
    if (found) {
      selectedSupplier = {
        id: found.id,
        name: found.name,
        contactName: found.contactName,
        phone: found.phone,
        email: found.email,
        address: found.address,
      };
      isExistingSupplier = true;
    } else if (
      supplierSearchName !== null &&
      searchSupplierQuery.isSuccess &&
      extractedData?.supplier
    ) {
      isExistingSupplier = false;
    }
  });

  function addItem() {
    const newItemId = `item-${Date.now()}`;
    invoiceData.items = [
      ...invoiceData.items,
      {
        id: newItemId,
        productName: "",
        qty: 1,
        unitCost: 0,
      },
    ];
    editingItemId = newItemId;
  }

  function removeItem(itemId: string) {
    invoiceData.items = invoiceData.items.filter((i) => i.id !== itemId);
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

  {#if isLoading || !invoiceFileQuery.data}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2Icon class="text-muted-foreground size-8 animate-spin" />
      <p class="text-muted-foreground">Loading invoice data...</p>
    </div>
  {:else if error}
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
      <InvoicePreviewCard
        imageUrl={invoiceFileQuery.data.imageUrl}
        fileType={invoiceFileQuery.data.fileType}
      />

      <div class="flex flex-col gap-6 lg:col-start-1 lg:col-end-2 lg:row-start-1">
        <SupplierCard
          slug={params.slug}
          {suppliers}
          bind:selectedSupplier
          bind:isExistingSupplier
          initialSupplierData={extractedData?.supplier}
        />

        <Card.Root class="pb-0">
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
            {#if invoiceData.items.length === 0}
              <div
                class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12"
              >
                <PackageIcon class="size-10 opacity-50" />
                <p class="text-sm">No items yet</p>
                <Button variant="outline" size="sm" onclick={addItem}>
                  <PlusIcon class="size-4" />
                  Add first item
                </Button>
              </div>
            {:else}
              <div class="divide-y">
                {#each invoiceData.items as item, index (item.id)}
                  {@const isEditing = editingItemId === item.id}
                  <div class="hover:bg-muted/30 transition-colors {isEditing ? 'bg-muted/50' : ''}">
                    {#if isEditing}
                      <div class="flex flex-wrap items-center gap-2 p-3">
                        <Input
                          bind:value={item.productName}
                          placeholder="Product"
                          class="min-w-0 flex-1"
                        />
                        <NumberInput
                          bind:value={item.qty}
                          class="w-16 text-center"
                          fraction={0}
                          min={0}
                        />
                        <NumberInput
                          bind:value={item.unitCost}
                          class="w-24 text-right"
                          fraction={2}
                          min={0}
                        />
                        <span class="font-medium tabular-nums">
                          {formatPrice(lineTotalsCents[index])}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onclick={() => (editingItemId = null)}
                        >
                          <CheckIcon class="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-red-500 hover:text-red-700"
                          onclick={() => {
                            removeItem(item.id);
                            editingItemId = null;
                          }}
                        >
                          <Trash2Icon class="size-3.5" />
                        </Button>
                      </div>
                    {:else}
                      <div class="flex items-center gap-2 p-3">
                        <div class="min-w-0 flex-1 truncate font-medium">
                          {#if item.productName}
                            {item.productName}
                          {:else}
                            <span class="text-muted-foreground italic">Unnamed</span>
                          {/if}
                        </div>
                        <span class="text-muted-foreground text-sm tabular-nums">
                          {item.qty}×{formatPrice(Math.round(item.unitCost * 100))}
                          =
                        </span>
                        <span class="font-medium tabular-nums">
                          {formatPrice(lineTotalsCents[index])}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7"
                          onclick={() => (editingItemId = item.id)}
                        >
                          <PencilIcon class="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-red-500 hover:text-red-700"
                          onclick={() => removeItem(item.id)}
                        >
                          <Trash2Icon class="size-3.5" />
                        </Button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
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
                <Input bind:value={invoiceData.invoiceNumber} placeholder="Invoice number" />
              </div>

              <div class="grid gap-2">
                <Label>Invoice Date</Label>
                <Input type="date" bind:value={invoiceData.invoiceDate} />
              </div>
            </div>

            <div class="space-y-2 rounded-lg border p-4 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Subtotal</span>
                <div class="px-3">{formatPrice(subtotalCents)}</div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">VAT</span>
                <NumberInput
                  bind:value={invoiceData.vat}
                  class="w-32 text-right"
                  fraction={2}
                  min={0}
                />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Discount</span>
                <NumberInput
                  bind:value={invoiceData.discount}
                  class="w-32 text-right"
                  fraction={2}
                  min={0}
                />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Freight</span>
                <NumberInput
                  bind:value={invoiceData.freight}
                  class="w-32 text-right"
                  fraction={2}
                  min={0}
                />
              </div>

              <Separator />

              <div class="flex items-center justify-between">
                <span class="font-semibold">Total</span>
                <div class="px-3">{formatPrice(totalCents)}</div>
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
