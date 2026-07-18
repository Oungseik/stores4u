<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { suppliersFilterSchema } from "$lib/search_param";
  import { formatDate, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.suppliers.delete.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_supplier_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.get.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_supplier"));
      },
    }),
  );

  type ApiSupplier = {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    address: string | null;
    paymentTerms: string | null;
    purchaseInvoicesCount: number;
    totalPurchases: number;
    lastPurchase: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const searchParams = useSearchParams(suppliersFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const suppliers = createInfiniteQuery(() =>
    orpc.suppliers.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 6,
        cursor,
        search: debouncedSearch.current || undefined,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allSuppliers = $derived(suppliers.data?.pages.flatMap((page) => page.items) ?? []);

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  function deleteSupplier(supplier: ApiSupplier) {
    confirmDelete({
      title: msg.ui_delete_supplier(),
      description: msg.confirm_delete_named({ name: supplier.name }),
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id: supplier.id });
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[{ label: msg.ui_dashboard(), href: `/` }, { label: msg.ui_suppliers() }]}
  >
    {#snippet actions()}
      <a href={localizePath("/purchases/suppliers/add")} class={buttonVariants()}>
        <PlusIcon class="size-4" />
        {msg.ui_add_supplier()}
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">{msg.ui_suppliers()}</h1>
    <p class="text-muted-foreground text-sm">
      {msg.ui_manage_supplier_information_and_relationships()}
    </p>
  </div>

  <section class="@container/main space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <FilterBar.Search
        placeholder={msg.ui_search_suppliers_by_name_contact_or_email()}
        value={searchParams.search}
        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
      />
      <FilterBar.Reset />
    </FilterBar.Root>

    {#if suppliers.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if suppliers.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">{msg.ui_failed_to_load_suppliers()}</p>
      </div>
    {:else if allSuppliers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Building2Icon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_suppliers_found()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? msg.ui_try_clearing_filters()
            : msg.ui_add_your_first_supplier_to_get_started()}
        </p>
      </div>
    {:else}
      <!-- Suppliers Grid -->
      <div class="grid grid-cols-1 gap-4 @[340px]/main:grid-cols-2 @[680px]/main:grid-cols-3">
        {#each allSuppliers as supplier (supplier.id)}
          <Card.Root class="group transition-all duration-200 hover:shadow-md">
            <Card.Header>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                    <Building2Icon class="text-primary size-5" />
                  </div>
                  <div>
                    <Card.Title class="text-base">{supplier.name}</Card.Title>
                    {#if supplier.contactName}
                      <Card.Description class="flex items-center gap-1">
                        <UserIcon class="size-3" />
                        {supplier.contactName}
                      </Card.Description>
                    {/if}
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Content class="space-y-3">
              <div class="space-y-1 text-sm">
                {#if supplier.email}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <MailIcon class="size-3" />
                    <a href={`mailto:${supplier.email}`} class="truncate hover:underline"
                      >{supplier.email}</a
                    >
                  </div>
                {/if}
                {#if supplier.phone}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon class="size-3" />
                    <a href={`tel:${supplier.phone}`} class="hover:underline">{supplier.phone}</a>
                  </div>
                {/if}
                {#if supplier.phone2}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon class="size-3" />
                    <a href={`tel:${supplier.phone2}`} class="hover:underline">{supplier.phone2}</a>
                  </div>
                {/if}
              </div>

              <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">{msg.ui_total_purchases()}</p>
                  <p class="font-semibold">
                    {formatPrice(supplier.totalPurchases, shop.currency)}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-xs">{msg.ui_invoices()}</p>
                  <p class="font-semibold">{supplier.purchaseInvoicesCount}</p>
                </div>
              </div>

              {#if supplier.lastPurchase}
                <div class="text-muted-foreground flex items-center gap-2 text-xs">
                  <ReceiptIcon class="size-3" />
                  Last purchase: {formatDate(supplier.lastPurchase)}
                </div>
              {/if}
            </Card.Content>
            <Card.Footer class="flex flex-col gap-2 pt-0">
              <Button
                variant="outline"
                class="w-full"
                href={localizePath(`/purchases/suppliers/${supplier.id}`)}
              >
                {msg.ui_view_details()}
              </Button>
              <div class="flex w-full gap-2">
                <Button
                  variant="destructive"
                  class="flex-1"
                  onclick={() => deleteSupplier(supplier)}
                >
                  <Trash2Icon class="size-4" />
                  {msg.ui_delete()}
                </Button>
                <a
                  href={localizePath(`/purchases/suppliers/${supplier.id}/edit`)}
                  class={buttonVariants({ variant: "outline", class: "flex-1" })}
                >
                  <PencilIcon class="size-4" />
                  {msg.ui_edit()}
                </a>
              </div>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>

      {#if suppliers.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => suppliers.fetchNextPage()}
            disabled={suppliers.isFetchingNextPage}
          >
            {#if suppliers.isFetchingNextPage}
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
</div>
