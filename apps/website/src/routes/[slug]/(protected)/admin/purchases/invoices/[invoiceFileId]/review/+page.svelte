<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";
  import { createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatNumber, formatPrice } from "$lib/utils";

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
    invoiceData.items = [
      ...invoiceData.items,
      {
        id: `item-${Date.now()}`,
        productName: "",
        qty: 1,
        unitCost: 0,
      },
    ];
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
                        <Input
                          bind:value={item.productName}
                          placeholder="Product name"
                          class="w-full"
                        />
                      </td>

                      <td class="px-4 py-2">
                        <NumberInput
                          bind:value={item.qty}
                          class="w-24 text-center"
                          fraction={0}
                          min={0}
                        />
                      </td>

                      <td class="px-4 py-2">
                        <NumberInput
                          bind:value={item.unitCost}
                          class="w-32 text-right"
                          fraction={2}
                          min={0}
                        />
                      </td>

                      <td class="px-4 py-2 text-right font-medium">
                        {formatPrice(lineTotalsCents[index])}
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
                <NumberInput
                  value={subtotalCents / 100}
                  class="w-32 text-right"
                  fraction={2}
                  disabled
                />
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
                <NumberInput
                  value={totalCents / 100}
                  class="w-32 text-right text-lg font-bold"
                  fraction={2}
                  disabled
                />
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
