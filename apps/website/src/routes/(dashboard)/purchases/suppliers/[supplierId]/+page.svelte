<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import {
    type PurchaseInvoiceItem,
    createColumns,
  } from "$lib/components/tables/purchase-invoices/columns";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.suppliers.delete.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_supplier_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_supplier"));
      },
    }),
  );

  const supplierQuery = createQuery(() =>
    orpc.suppliers.get.queryOptions({
      input: { supplierId: params.supplierId },
    }),
  );

  const supplier = $derived(supplierQuery.data);

  const columns = $derived(createColumns(shop.currency));

  const invoices = createInfiniteQuery(() =>
    orpc.purchaseInvoices.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        supplierId: params.supplierId,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true && !!params.supplierId,
    }),
  );

  const allInvoices = $derived(invoices.data?.pages.flatMap((page) => page.items) ?? []);

  function handleRowClick(invoice: PurchaseInvoiceItem) {
    if (invoice.invoiceFileId) {
      goto(localizePath(`/purchases/invoices/${invoice.invoiceFileId}`));
    }
  }

  function deleteSupplier() {
    if (!supplier) return;
    confirmDelete({
      title: msg.ui_delete_supplier(),
      description: msg.confirm_delete_named({ name: supplier.name }),
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id: supplier.id });
        goto(localizePath("/purchases/suppliers"));
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_purchases(), href: `/purchases` },
      { label: msg.ui_suppliers(), href: `/purchases/suppliers` },
      { label: supplier?.name ?? msg.ui_supplier() },
    ]}
  >
    {#snippet actions()}
      {#if supplier}
        <Button variant="destructive" onclick={deleteSupplier}>
          <Trash2Icon class="size-4" />
          {msg.ui_delete()}
        </Button>
        <a
          href={localizePath(`/purchases/suppliers/${params.supplierId}/edit`)}
          class={buttonVariants({ variant: "outline" })}
        >
          <PencilIcon class="size-4" />
          {msg.ui_edit()}
        </a>
      {/if}
    {/snippet}
  </AdminDashboardHeader>

  {#if supplierQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if supplierQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">{msg.ui_failed_to_load_supplier()}</p>
    </div>
  {:else if supplier}
    <section class="max-w-2xl space-y-6">
      <div class="flex items-center gap-4">
        <div class="bg-primary/10 flex size-14 items-center justify-center rounded-full">
          <Building2Icon class="text-primary size-7" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{supplier.name}</h1>
          {#if supplier.contactName}
            <p class="text-muted-foreground text-sm">{supplier.contactName}</p>
          {/if}
        </div>
      </div>

      <div>
        <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          {msg.ui_contact_information()}
        </h4>
        <div class="space-y-2 rounded-md border p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_contact_person()}</span>
            <span class="font-medium">{supplier.contactName ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_phone()}</span>
            <span>{supplier.phone ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_phone_2()}</span>
            <span>{supplier.phone2 ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_email()}</span>
            <span>{supplier.email ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">{msg.ui_address()}</span>
            <span class="max-w-xs text-right">{supplier.address ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_payment_terms()}</span>
            <span class="font-medium">{supplier.paymentTerms ?? "—"}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {msg.ui_purchase_invoices()}
      </h4>

      {#if invoices.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if invoices.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">{msg.ui_failed_to_load_invoices()}</p>
        </div>
      {:else if allInvoices.length === 0}
        <div
          class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center"
        >
          <FileTextIcon class="size-10 opacity-50" />
          <p class="text-sm">{msg.ui_no_purchase_invoices_yet()}</p>
        </div>
      {:else}
        <DataTable {columns} data={allInvoices} loading={false} onRowClick={handleRowClick} />

        {#if invoices.hasNextPage}
          <div class="flex justify-center">
            <Button
              variant="outline"
              onclick={() => invoices.fetchNextPage()}
              disabled={invoices.isFetchingNextPage}
            >
              {#if invoices.isFetchingNextPage}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                {msg.ui_loading_b04ba49()}
              {:else}
                {msg.ui_load_more()}
              {/if}
            </Button>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</div>
