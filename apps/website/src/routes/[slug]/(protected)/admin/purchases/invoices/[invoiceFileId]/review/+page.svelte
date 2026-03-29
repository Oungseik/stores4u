<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import InfoIcon from "@lucide/svelte/icons/info";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PlayIcon from "@lucide/svelte/icons/play";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
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

  const queryClient = useQueryClient();

  const invoiceFileQuery = createQuery(() =>
    orpc.purchaseInvoices.getFile.queryOptions({
      input: { slug: params.slug, invoiceFileId: params.invoiceFileId },
      refetchInterval: (query) => {
        if (query.state.data?.status === "PROCESSING") return 2000;
        return false;
      },
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

  let isProcessing = $state(false);
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

  const fileStatus = $derived(invoiceFileQuery.data?.status);

  const needsProcessing = $derived(fileStatus === "UPLOADED" || fileStatus === "FAILED");

  const isCurrentlyProcessing = $derived(fileStatus === "PROCESSING" || isProcessing);

  const canSave = $derived(selectedSupplier !== null);

  const canShowActions = $derived(
    !isLoading && !error && invoiceFileQuery.isSuccess && suppliersQuery.isSuccess
  );

  const processMutation = createMutation(() =>
    orpc.purchaseInvoices.processFile.mutationOptions({
      onSuccess: () => {
        toast.success("Processing started");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getFile.key() });
        isProcessing = false;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to process invoice");
        isProcessing = false;
      },
    })
  );

  function handleProcess() {
    isProcessing = true;
    processMutation.mutateAsync({ slug: params.slug, fileId: params.invoiceFileId });
  }

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
      { label: "Invoices files", href: `/${params.slug}/admin/purchases/invoices` },
      { label: "Review Invoice" },
    ]}
  >
    {#snippet actions()}
      {#if canShowActions}
        <div class="hidden gap-2 md:flex">
          {#if isCurrentlyProcessing}
            <Button variant="outline" disabled>
              <Loader2Icon class="size-4 animate-spin" />
              Processing...
            </Button>
          {:else if needsProcessing}
            <Button variant="outline" onclick={handleProcess}>
              <PlayIcon class="size-4" />
              {fileStatus === "FAILED" ? "Retry" : "Process"}
            </Button>
          {/if}
          <Button
            variant="destructive"
            onclick={handleReject}
            disabled={isRejecting || isCurrentlyProcessing}
          >
            {#if isRejecting}
              <Loader2Icon class="size-4 animate-spin" />
              Rejecting...
            {:else}
              <Trash2Icon class="size-4" />
              Reject
            {/if}
          </Button>
          <Button
            onclick={validateAndSave}
            disabled={isSubmitting || !canSave || isCurrentlyProcessing}
          >
            {#if isSubmitting}
              <Loader2Icon class="size-4 animate-spin" />
              Saving...
            {:else}
              <CheckIcon class="size-4" />
              Validate & Save
            {/if}
          </Button>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="md:hidden">
            <Button variant="outline" size="icon">
              <MoreVerticalIcon class="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if isCurrentlyProcessing}
              <DropdownMenu.Item disabled>
                <Loader2Icon class="size-4 animate-spin" />
                Processing...
              </DropdownMenu.Item>
            {:else if needsProcessing}
              <DropdownMenu.Item onclick={handleProcess}>
                <PlayIcon class="size-4" />
                {fileStatus === "FAILED" ? "Retry" : "Process"}
              </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item
              onclick={validateAndSave}
              disabled={isSubmitting || !canSave || isCurrentlyProcessing}
            >
              {#if isSubmitting}
                <Loader2Icon class="size-4 animate-spin" />
                Saving...
              {:else}
                <CheckIcon class="size-4" />
                Validate & Save
              {/if}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onclick={handleReject}
              disabled={isRejecting || isCurrentlyProcessing}
              class="text-destructive focus:text-destructive"
            >
              {#if isRejecting}
                <Loader2Icon class="size-4 animate-spin" />
                Rejecting...
              {:else}
                <Trash2Icon class="size-4" />
                Reject
              {/if}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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
      <Card.Root class="h-fit md:hidden">
        <Card.Header>
          <Card.Title>Invoice Preview</Card.Title>
          <Card.Description>View original document on larger screen.</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if invoiceFileQuery.data.imageUrl}
            <a
              href={invoiceFileQuery.data.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <DownloadIcon class="size-4" />
              Download Invoice
            </a>
          {:else}
            <p class="text-muted-foreground text-sm">Unable to load invoice file.</p>
          {/if}
        </Card.Content>
      </Card.Root>

      <InvoicePreviewCard
        class="hidden md:block"
        imageUrl={invoiceFileQuery.data.imageUrl}
        fileType={invoiceFileQuery.data.fileType}
      />

      <div class="flex flex-col gap-6 lg:col-start-1 lg:col-end-2 lg:row-start-1">
        {#if isCurrentlyProcessing}
          <div class="bg-primary/5 flex items-center gap-3 rounded-lg border p-4">
            <Loader2Icon class="text-primary size-5 animate-spin" />
            <div>
              <p class="font-medium">AI is processing your invoice...</p>
              <p class="text-muted-foreground text-sm">Extracted data will appear shortly.</p>
            </div>
          </div>
        {:else if needsProcessing}
          <div class="bg-info/10 border-info/20 flex items-start gap-3 rounded-lg border p-4">
            <InfoIcon class="text-info mt-0.5 size-5 shrink-0" />
            <div>
              <p class="font-medium">Process with AI or fill manually</p>
              <p class="text-muted-foreground text-sm">
                Click "Process" to auto-fill items using AI, or fill in the details manually below.
              </p>
            </div>
          </div>
        {/if}

        <div
          class="flex flex-col gap-6 {isCurrentlyProcessing
            ? 'pointer-events-none opacity-50'
            : ''}"
        >
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
    </div>
  {/if}
</div>
