<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import InvoicePreviewCard from "$lib/components/cards/InvoicePreviewCard.svelte";
  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { calcLineTotalCents } from "$lib/utils";

  import type { PageProps } from "./$types";
  import InvoiceDetailsCard from "../review/InvoiceDetailsCard.svelte";
  import ItemsCard, { type InvoiceItem, type ProductOption } from "../review/ItemsCard.svelte";

  type InvoiceData = {
    invoiceNumber: string;
    invoiceDate: string;
    vat: number;
    discount: number;
    freight: number;
    notes: string;
    items: InvoiceItem[];
  };

  const { params, data: shop }: PageProps = $props();
  const invoice = $derived(shop.invoice);

  const queryClient = useQueryClient();

  const suppliersQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { pageSize: 1000 },
    }),
  );

  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { pageSize: 1000 },
    }),
  );

  const invoiceFileQuery = createQuery(() =>
    orpc.purchaseInvoices.getFile.queryOptions({
      input: { invoiceFileId: params.invoiceFileId },
    }),
  );

  const products = $derived(
    (productsQuery.data?.items ?? []).map(
      (p) => ({ id: p.id, name: p.name, sku: p.sku }) satisfies ProductOption,
    ),
  );

  const isLoading = $derived(suppliersQuery.isLoading || productsQuery.isLoading);

  const error = $derived.by(() => {
    return suppliersQuery.error || productsQuery.error || null;
  });

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

  let hasBeenInitialized = $state(false);
  let isExistingSupplier = $state(true);
  let isSubmitting = $state(false);
  let selectedSupplier = $state<Supplier | null>(null);

  const canSave = $derived(
    selectedSupplier !== null &&
      invoiceData.items.length > 0 &&
      invoiceData.items.every((i) => i.productId && i.invoiceItemName.trim()),
  );

  const canShowActions = $derived(
    !isLoading && !error && suppliersQuery.isSuccess && productsQuery.isSuccess,
  );

  const lineTotalsCents = $derived(
    invoiceData.items.map((item) => calcLineTotalCents(item.qty, item.unitCost)),
  );

  const subtotalCents = $derived(lineTotalsCents.reduce((sum, total) => sum + total, 0));

  $effect(() => {
    if (hasBeenInitialized) return;
    if (!invoice) return;

    invoiceData = {
      invoiceNumber: invoice.invoiceNumber ?? "",
      invoiceDate: invoice.invoiceDate ?? "",
      vat: (invoice.vatCents ?? 0) / 100,
      discount: (invoice.discountCents ?? 0) / 100,
      freight: (invoice.freightCents ?? 0) / 100,
      notes: invoice.notes ?? "",
      items: invoice.items.map((item, idx) => ({
        id: `item-${idx}`,
        invoiceItemName: item.invoiceItemName ?? "",
        productId: item.product?.id,
        matchedProductName: item.product?.name,
        qty: item.qty,
        unitCost: item.unitCostCents / 100,
        saveAlias: false,
      })),
    };

    hasBeenInitialized = true;
  });

  $effect(() => {
    if (invoice?.supplier && !selectedSupplier) {
      selectedSupplier = {
        id: invoice.supplier.id,
        name: invoice.supplier.name,
        contactName: invoice.supplier.contactName,
        phone: invoice.supplier.phone,
        phone2: invoice.supplier.phone2,
        email: invoice.supplier.email,
        address: invoice.supplier.address,
      };
      isExistingSupplier = true;
    }
  });

  const updateMutation = createMutation(() =>
    orpc.purchaseInvoices.updateInvoice.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getInvoice.key() });
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.get.key() });
        queryClient.invalidateQueries({ queryKey: orpc.inventory.listMovements.key() });
      },
    }),
  );

  async function handleSave() {
    if (!selectedSupplier || invoiceData.items.length === 0 || !invoice) return;

    if (invoiceData.items.some((i) => !i.invoiceItemName.trim())) {
      toast.error("Please fill in all item names before saving.");
      return;
    }

    isSubmitting = true;

    try {
      const totalCents = Math.round(
        subtotalCents +
          invoiceData.vat * 100 -
          invoiceData.discount * 100 +
          invoiceData.freight * 100,
      );

      await updateMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        supplierId: selectedSupplier.id,
        subtotalCents,
        vatCents: Math.round(invoiceData.vat * 100),
        discountCents: Math.round(invoiceData.discount * 100),
        freightCents: Math.round(invoiceData.freight * 100),
        totalCents,
        notes: invoiceData.notes || undefined,
        items: invoiceData.items
          .filter((item): item is typeof item & { productId: string } => !!item.productId)
          .map((item) => ({
            productId: item.productId,
            invoiceItemName: item.invoiceItemName,
            qty: item.qty,
            unitCostCents: Math.round(item.unitCost * 100),
            lineSubtotalCents: Math.round(item.qty * item.unitCost * 100),
            lineTotalCents: Math.round(item.qty * item.unitCost * 100),
            vatCents: 0,
            discountCents: 0,
            freightCents: 0,
            saveAlias: item.saveAlias,
          })),
      });

      toast.success("Invoice updated successfully!");
      goto(`/purchases/invoices/${params.invoiceFileId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update invoice");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Invoice Files", href: `/purchases/invoices` },
      { label: "Edit Invoice" },
    ]}
  >
    {#snippet actions()}
      {#if canShowActions}
        <div class="hidden gap-2 lg:flex">
          <Button variant="outline" onclick={() => history.back()}>Cancel</Button>
          <Button onclick={handleSave} disabled={isSubmitting || !canSave}>
            {#if isSubmitting}
              <Loader2Icon class="size-4 animate-spin" />
              Saving...
            {:else}
              <CheckIcon class="size-4" />
              Save Changes
            {/if}
          </Button>
        </div>
      {/if}
    {/snippet}
  </AdminDashboardHeader>

  {#if !invoice}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2Icon class="text-muted-foreground size-8 animate-spin" />
      <p class="text-muted-foreground">Loading invoice data...</p>
    </div>
  {:else if error}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <XIcon class="text-destructive size-12" />
      <div class="text-center">
        <p class="text-lg font-semibold">Error Loading Data</p>
        <p class="text-muted-foreground">{error?.message ?? "Failed to load required data"}</p>
      </div>
      <Button variant="outline" onclick={() => history.back()}>Go Back</Button>
    </div>
  {:else}
    <div class="grid gap-6 xl:grid-cols-2">
      <InvoicePreviewCard
        imageUrl={invoiceFileQuery.data?.imageUrl}
        fileType={invoiceFileQuery.data?.fileType}
      />

      <div class="flex flex-col gap-6 xl:col-start-1 xl:col-end-2 xl:row-start-1">
        <SupplierCard {suppliers} bind:selectedSupplier bind:isExistingSupplier />

        <ItemsCard
          bind:items={invoiceData.items}
          {products}
          currency={shop.currency}
          onProductCreated={() => {
            queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
          }}
        />

        <InvoiceDetailsCard
          bind:invoiceNumber={invoiceData.invoiceNumber}
          bind:invoiceDate={invoiceData.invoiceDate}
          bind:vat={invoiceData.vat}
          bind:discount={invoiceData.discount}
          bind:freight={invoiceData.freight}
          bind:notes={invoiceData.notes}
          {subtotalCents}
          currency={shop.currency}
        />

        <!-- Mobile save/cancel buttons -->
        <div class="flex gap-2 lg:hidden">
          <Button variant="outline" class="flex-1" onclick={() => history.back()}>Cancel</Button>
          <Button class="flex-1" onclick={handleSave} disabled={isSubmitting || !canSave}>
            {#if isSubmitting}
              <Loader2Icon class="size-4 animate-spin" />
              Saving...
            {:else}
              <CheckIcon class="size-4" />
              Save Changes
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
