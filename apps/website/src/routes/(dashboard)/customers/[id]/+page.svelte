<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import { goto } from "$app/navigation";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UsersIcon from "@lucide/svelte/icons/users";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatDate, formatOrderId, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.customers.delete.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_customer_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_customer"));
      },
    }),
  );

  const customerQuery = createQuery(() =>
    orpc.customers.get.queryOptions({
      input: { customerId: params.id },
    }),
  );

  const customer = $derived(customerQuery.data);

  const orders = createInfiniteQuery(() =>
    orpc.orders.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        customerId: params.id,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true && !!params.id,
    }),
  );

  const allOrders = $derived(orders.data?.pages.flatMap((page) => page.items) ?? []);

  function deleteCustomer() {
    if (!customer) return;
    confirmDelete({
      title: msg.ui_delete_customer(),
      description: msg.confirm_delete_named({ name: customer.name }),
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id: customer.id });
        goto(localizePath("/customers"));
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    hasPageHeading
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_customers(), href: `/customers` },
      { label: customer?.name ?? msg.ui_customer() },
    ]}
  >
    {#snippet actions()}
      {#if customer}
        <Button variant="destructive" onclick={deleteCustomer}>
          <Trash2Icon class="size-4" />
          {msg.ui_delete()}
        </Button>
        <a
          href={localizePath(`/customers/${params.id}/edit`)}
          class={buttonVariants({ variant: "outline" })}
        >
          <PencilIcon class="size-4" />
          {msg.ui_edit()}
        </a>
      {/if}
    {/snippet}
  </AdminDashboardHeader>

  {#if customerQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if customerQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">{msg.ui_failed_to_load_customer()}</p>
    </div>
  {:else if customer}
    <section class="max-w-2xl space-y-6">
      <div class="flex items-center gap-4">
        <div class="bg-primary/10 flex size-14 items-center justify-center rounded-full">
          <UsersIcon class="text-primary size-7" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          {#if customer.contactName}
            <p class="text-muted-foreground text-sm">{customer.contactName}</p>
          {/if}
        </div>
      </div>

      <div>
        <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          {msg.ui_contact_information()}
        </h4>
        <div class="space-y-2 rounded-md border p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_customer_type()}</span>
            <span class="font-medium"
              >{customer.customerType === "WHOLESALE" ? msg.ui_wholesale() : msg.ui_retail()}</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_contact_person()}</span>
            <span class="font-medium">{customer.contactName ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_phone()}</span>
            <span>{customer.phone ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_phone_2()}</span>
            <span>{customer.phone2 ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_email()}</span>
            <span>{customer.email ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">{msg.ui_address()}</span>
            <span class="max-w-xs text-right">{customer.address ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_tax_id()}</span>
            <span class="font-medium">{customer.taxId ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">{msg.ui_payment_terms()}</span>
            <span class="font-medium">{customer.paymentTerms ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">{msg.ui_notes()}</span>
            <span class="max-w-xs text-right whitespace-pre-wrap">{customer.notes ?? "—"}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {msg.ui_orders()}
      </h4>

      {#if orders.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if orders.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">{msg.ui_failed_to_load_orders()}</p>
        </div>
      {:else if allOrders.length === 0}
        <div
          class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center"
        >
          <ShoppingBagIcon class="size-10 opacity-50" />
          <p class="text-sm">{msg.ui_no_orders_yet()}</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each allOrders as order (order.id)}
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                <a
                  href={localizePath(`/orders/${order.id}`)}
                  class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5"
                >
                  <div
                    class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg"
                  >
                    <ReceiptIcon class="text-primary size-5" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      <span class="font-semibold">#{formatOrderId(order.id)}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt, true)}</span>
                      <span class="hidden sm:inline">•</span>
                      <span class="hidden sm:inline">{order.itemsCount} items</span>
                    </div>
                  </div>

                  <div class="shrink-0 text-right">
                    <p class="text-sm font-semibold">
                      {formatPrice(order.totalCents, shop.currency)}
                    </p>
                    <p class="text-xs text-emerald-600">{msg.paid()}</p>
                  </div>
                </a>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>

        {#if orders.hasNextPage}
          <div class="flex justify-center">
            <Button
              variant="outline"
              onclick={() => orders.fetchNextPage()}
              disabled={orders.isFetchingNextPage}
            >
              {#if orders.isFetchingNextPage}
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
