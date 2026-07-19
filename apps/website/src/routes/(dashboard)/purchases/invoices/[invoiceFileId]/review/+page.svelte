<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import CheckIcon from "@lucide/svelte/icons/check";
  import InfoIcon from "@lucide/svelte/icons/info";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PlayIcon from "@lucide/svelte/icons/play";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Alert from "@repo/ui/alert";
  import { Button } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { SvelteMap } from "svelte/reactivity";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import InvoicePreviewCard from "$lib/components/cards/InvoicePreviewCard.svelte";
  import SupplierCard, { type Supplier } from "$lib/components/cards/SupplierCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { calcLineTotalCents } from "$lib/utils";
  import { matchItems } from "$lib/utils/product_matching";

  import type { PageProps } from "./$types";
  import InvoiceDetailsCard from "./InvoiceDetailsCard.svelte";
  import ItemsCard, { type InvoiceItem, type ProductOption } from "./ItemsCard.svelte";

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

  const queryClient = useQueryClient();

  const invoiceFileQuery = createQuery(() =>
    orpc.purchaseInvoices.getFile.queryOptions({
      input: { invoiceFileId: params.invoiceFileId },
      refetchInterval: (query) => {
        if (query.state.data?.status === "PROCESSING") return 5000;
        return false;
      },
    }),
  );

  const suppliersQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { pageSize: 1000 },
    }),
  );

  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { pageSize: 100 },
    }),
  );

  const products = $derived(
    (productsQuery.data?.items ?? []).map(
      (p) => ({ id: p.id, name: p.name, sku: p.sku }) satisfies ProductOption,
    ),
  );

  const aliasesByProductId = $derived(
    (() => {
      const map = new SvelteMap<string, string[]>();
      for (const p of productsQuery.data?.items ?? []) {
        if (p.aliases?.length) {
          map.set(p.id, p.aliases);
        }
      }
      return map;
    })(),
  );

  const extractedData = $derived(invoiceFileQuery.data?.ocrResult?.extractedData ?? null);

  const supplierSearchName = $derived(extractedData?.supplier?.name ?? null);

  const searchSupplierQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { pageSize: 1, search: supplierSearchName ?? "" },
      enabled: supplierSearchName !== null,
    }),
  );

  const isLoading = $derived(
    invoiceFileQuery.isLoading ||
      suppliersQuery.isLoading ||
      productsQuery.isLoading ||
      (supplierSearchName !== null && searchSupplierQuery.isLoading),
  );

  const error = $derived.by(() => {
    return (
      invoiceFileQuery.error ||
      suppliersQuery.error ||
      productsQuery.error ||
      searchSupplierQuery.error ||
      null
    );
  });

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

  let hasBeenInitialized = $state(false);
  let isExistingSupplier = $state(true);
  let isSubmitting = $state(false);
  let selectedSupplier = $state<Supplier | null>(null);

  const fileStatus = $derived(invoiceFileQuery.data?.status);

  const needsProcessing = $derived(
    fileStatus === "UPLOADED" || fileStatus === "FAILED" || fileStatus === "REJECTED",
  );

  const isRejected = $derived(fileStatus === "REJECTED");

  const rejectionReason = $derived(invoiceFileQuery.data?.ocrResult?.rejectionReason ?? null);

  const isCurrentlyProcessing = $derived(fileStatus === "PROCESSING" || isProcessing);

  const canShowActions = $derived(
    !isLoading &&
      !error &&
      invoiceFileQuery.isSuccess &&
      suppliersQuery.isSuccess &&
      productsQuery.isSuccess,
  );

  const processMutation = createMutation(() => orpc.purchaseInvoices.processFile.mutationOptions());

  function handleProcess() {
    isProcessing = true;
    processMutation.mutate(
      { fileId: params.invoiceFileId },
      {
        onSuccess: () => {
          toast.success(msg.ui_processing_started());
          queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getFile.key() });
          isProcessing = false;
        },
        onError: (error) => {
          toast.error(localizeError(error, "ui_failed_to_process_invoice"));
          isProcessing = false;
        },
      },
    );
  }

  const lineTotalsCents = $derived(
    invoiceData.items.map((item) => calcLineTotalCents(item.qty, item.unitCost)),
  );

  const subtotalCents = $derived(lineTotalsCents.reduce((sum, total) => sum + total, 0));

  $effect(() => {
    if (hasBeenInitialized) return;

    const data = invoiceFileQuery.data?.ocrResult?.extractedData;
    if (!data) return;

    if (productsQuery.isLoading) return;

    const extractedItems = data.items ?? [];
    const matches = matchItems(
      extractedItems.map((i) => i.productName),
      products,
      aliasesByProductId,
    );

    invoiceData = {
      invoiceNumber: data.invoice?.invoiceNumber ?? "",
      invoiceDate: data.invoice?.invoiceDate ?? "",
      vat: (data.invoice?.vatCents ?? 0) / 100,
      discount: (data.invoice?.discountCents ?? 0) / 100,
      freight: (data.invoice?.freightCents ?? 0) / 100,
      notes: data.invoice?.notes ?? "",
      items: extractedItems.map((item, idx) => {
        const match = matches.get(item.productName);
        return {
          id: `item-${idx}`,
          invoiceItemName: item.productName,
          productId: match?.productId,
          matchedProductName: match?.productName,
          qty: item.quantity,
          unitCost: item.unitCostCents / 100,
          saveAlias: !match,
        } satisfies InvoiceItem;
      }),
    };

    hasBeenInitialized = true;
  });

  $effect(() => {
    const found = searchSupplierQuery.data?.items?.[0];
    if (found) {
      selectedSupplier = {
        id: found.id,
        name: found.name,
        contactName: found.contactName,
        phone: found.phone,
        phone2: found.phone2,
        email: found.email,
        address: found.address,
        paymentTerms: found.paymentTerms,
      };
      isExistingSupplier = true;
    } else if (
      selectedSupplier === null &&
      supplierSearchName !== null &&
      searchSupplierQuery.isSuccess &&
      extractedData?.supplier
    ) {
      isExistingSupplier = false;
    }
  });

  async function validateAndSave() {
    if (!selectedSupplier) {
      toast.error(msg.ui_please_select_a_supplier_before_saving());
      return;
    }
    if (invoiceData.items.length === 0) {
      toast.error(msg.ui_please_add_at_least_one_invoice_item());
      return;
    }
    if (invoiceData.items.some((i) => !i.productId)) {
      toast.error(msg.ui_please_select_a_product_for_all_items());
      return;
    }
    if (invoiceData.items.some((i) => !i.invoiceItemName.trim())) {
      toast.error(msg.ui_please_fill_in_all_item_names_before_saving());
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

      await submitReviewMutation.mutateAsync({
        invoiceFileId: params.invoiceFileId,
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

      toast.success(msg.ui_invoice_validated_and_saved_successfully());
      goto(localizePath(`/purchases/invoices`));
    } catch (e) {
      toast.error(localizeError(e, "error_save_invoice"));
    } finally {
      isSubmitting = false;
    }
  }

  const submitReviewMutation = createMutation(() =>
    orpc.purchaseInvoices.submitReview.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.listFiles.key() });
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.getFile.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.get.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.stats.key() });
        queryClient.invalidateQueries({ queryKey: orpc.inventory.listMovements.key() });
      },
    }),
  );

  const rejectMutation = createMutation(() => orpc.purchaseInvoices.rejectFile.mutationOptions());

  let isRejecting = $state(false);

  function handleReject() {
    confirmDelete({
      title: msg.ui_reject_invoice(),
      description: msg.ui_are_you_sure_you_want_to_reject_this_invoice_the_ocr_da(),
      confirm: { text: msg.ui_reject() },
      onConfirm: async () => {
        isRejecting = true;
        rejectMutation.mutate(
          { invoiceFileId: params.invoiceFileId },
          {
            onSuccess: () => {
              toast.success(msg.ui_invoice_rejected());
              goto(localizePath(`/purchases/invoices`));
            },
            onError: (e) => {
              console.error(e);
              toast.error(msg.ui_failed_to_reject_invoice());
            },
            onSettled: () => (isRejecting = false),
          },
        );
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_invoices_files(), href: `/purchases/invoices` },
      { label: msg.ui_review_invoice() },
    ]}
  >
    {#snippet actions()}
      {#if canShowActions}
        <div class="hidden gap-2 lg:flex">
          {#if isCurrentlyProcessing}
            <Button variant="outline" disabled>
              <Loader2Icon class="size-4 animate-spin" />
              {msg.ui_processing()}
            </Button>
          {:else if needsProcessing}
            <Button variant="outline" onclick={handleProcess}>
              <PlayIcon class="size-4" />
              {msg.ui_process()}
            </Button>
          {/if}
          <Button
            variant="destructive"
            onclick={handleReject}
            disabled={isRejecting || isCurrentlyProcessing}
          >
            {#if isRejecting}
              <Loader2Icon class="size-4 animate-spin" />
              {msg.ui_rejecting()}
            {:else}
              <Trash2Icon class="size-4" />
              {msg.ui_reject()}
            {/if}
          </Button>
          <Button onclick={validateAndSave} disabled={isSubmitting || isCurrentlyProcessing}>
            {#if isSubmitting}
              <Loader2Icon class="size-4 animate-spin" />
              {msg.ui_saving()}
            {:else}
              <CheckIcon class="size-4" />
              {msg.ui_validate_and_save()}
            {/if}
          </Button>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="lg:hidden">
            <Button variant="outline" size="icon">
              <MoreVerticalIcon class="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if isCurrentlyProcessing}
              <DropdownMenu.Item disabled>
                <Loader2Icon class="size-4 animate-spin" />
                {msg.ui_processing()}
              </DropdownMenu.Item>
            {:else if needsProcessing}
              <DropdownMenu.Item onclick={handleProcess}>
                <PlayIcon class="size-4" />
                {msg.ui_process()}
              </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item
              onclick={validateAndSave}
              disabled={isSubmitting || isCurrentlyProcessing}
            >
              {#if isSubmitting}
                <Loader2Icon class="size-4 animate-spin" />
                {msg.ui_saving()}
              {:else}
                <CheckIcon class="size-4" />
                {msg.ui_validate_and_save()}
              {/if}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onclick={handleReject}
              disabled={isRejecting || isCurrentlyProcessing}
              class="text-destructive focus:text-destructive"
            >
              {#if isRejecting}
                <Loader2Icon class="size-4 animate-spin" />
                {msg.ui_rejecting()}
              {:else}
                <Trash2Icon class="size-4" />
                {msg.ui_reject()}
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
      <p class="text-muted-foreground">{msg.ui_loading_invoice_data()}</p>
    </div>
  {:else if error}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <XIcon class="text-destructive size-12" />
      <div class="text-center">
        <p class="text-lg font-semibold">{msg.ui_error_loading_invoice()}</p>
        <p class="text-muted-foreground">{localizeError(error, "error_invoice_file_not_found")}</p>
      </div>
      <Button variant="outline" onclick={() => history.back()}>{msg.ui_go_back()}</Button>
    </div>
  {:else}
    <div class="grid gap-6 xl:grid-cols-2">
      <InvoicePreviewCard
        imageUrl={invoiceFileQuery.data.imageUrl}
        fileType={invoiceFileQuery.data.fileType}
      />

      <div class="flex flex-col gap-6 xl:col-start-1 xl:col-end-2 xl:row-start-1">
        {#if isCurrentlyProcessing}
          <div class="bg-primary/5 flex items-center gap-3 rounded-lg border p-4">
            <Loader2Icon class="text-primary size-5 animate-spin" />
            <div>
              <p class="font-medium">{msg.ui_ai_is_processing_your_invoice()}</p>
              <p class="text-muted-foreground text-sm">
                {msg.ui_extracted_data_will_appear_shortly()}
              </p>
            </div>
          </div>
        {:else if isRejected}
          <Alert.Root variant="destructive">
            <AlertTriangleIcon class="size-4" />
            <Alert.Title>{msg.ui_ai_rejected_this_file()}</Alert.Title>
            <Alert.Description>
              {#if rejectionReason}
                <p class="mb-2">{rejectionReason}</p>
              {/if}
              <p class="text-sm">
                {msg.ui_you_can_retry_processing_delete_the_file_or_fill_in_the()}
              </p>
            </Alert.Description>
          </Alert.Root>
        {:else if needsProcessing}
          <div class="bg-info/10 border-info/20 flex items-start gap-3 rounded-lg border p-4">
            <InfoIcon class="text-info mt-0.5 size-5 shrink-0" />
            <div>
              <p class="font-medium">{msg.ui_process_with_ai_or_fill_manually()}</p>
              <p class="text-muted-foreground text-sm">
                {msg.ui_click_process_to_auto_fill_items_using_ai_or_fill_in_th()}
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
            {suppliers}
            bind:selectedSupplier
            bind:isExistingSupplier
            initialSupplierData={extractedData?.supplier}
          />

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
        </div>
      </div>
    </div>
  {/if}
</div>
