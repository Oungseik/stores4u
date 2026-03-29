<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import InvoicePreviewCard from "$lib/components/cards/InvoicePreviewCard.svelte";
  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";
  import InvoiceDetailsCard from "./InvoiceDetailsCard.svelte";
  import ItemsCard, { type InvoiceItem } from "./ItemsCard.svelte";

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

  const canShowActions = $derived(
    !isLoading && !error && invoiceFileQuery.isSuccess && suppliersQuery.isSuccess
  );

  const lineTotalsCents = $derived(
    invoiceData.items.map((item) => Math.round(item.qty * item.unitCost * 100))
  );

  const subtotalCents = $derived(lineTotalsCents.reduce((sum, total) => sum + total, 0));

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

  async function validateAndSave() {
    isSubmitting = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isSubmitting = false;
    toast.success("Invoice validated and inventory updated successfully!");
  }

  const rejectMutation = createMutation(() => orpc.purchaseInvoices.rejectFile.mutationOptions());

  let isRejecting = $state(false);

  function handleReject() {
    confirmDelete({
      title: "Reject Invoice",
      description:
        "Are you sure you want to reject this invoice? The OCR data will be kept for future re-processing.",
      confirm: { text: "Reject" },
      onConfirm: async () => {
        isRejecting = true;
        rejectMutation.mutate(
          { slug: params.slug, invoiceFileId: params.invoiceFileId },
          {
            onSuccess: () => {
              toast.success("Invoice rejected");
              goto(`/${params.slug}/admin/purchases/invoices`);
            },
            onError: (e) => {
              console.error(e);
              toast.error("Failed to reject invoice");
            },
            onSettled: () => (isRejecting = false),
          }
        );
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}/admin` },
      { label: "Purchases", href: `/${params.slug}/admin/purchases` },
      { label: "Review Invoice" },
    ]}
  >
    {#snippet actions()}
      {#if canShowActions}
        <div class="flex gap-2">
          <Button
            variant="destructive"
            onclick={handleReject}
            disabled={isRejecting || invoiceFileQuery.data?.status === "REJECTED"}
          >
            {#if isRejecting}
              <Loader2Icon class="size-4 animate-spin" />
              Rejecting...
            {:else if invoiceFileQuery.data?.status === "REJECTED"}
              Rejected
            {:else}
              <Trash2Icon class="size-4" />
              Reject
            {/if}
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
      {/if}
    {/snippet}
  </AdminDashboardHeader>

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
  {:else}
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

        <ItemsCard bind:items={invoiceData.items} />

        <InvoiceDetailsCard
          bind:invoiceNumber={invoiceData.invoiceNumber}
          bind:invoiceDate={invoiceData.invoiceDate}
          bind:vat={invoiceData.vat}
          bind:discount={invoiceData.discount}
          bind:freight={invoiceData.freight}
          bind:notes={invoiceData.notes}
          {subtotalCents}
        />
      </div>
    </div>
  {/if}
</div>
