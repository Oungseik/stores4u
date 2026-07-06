<script lang="ts">
  import { goto } from "$app/navigation";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
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
  import { formatDate, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.customers.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Customer deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete customer");
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
      title: "Delete Customer",
      description: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id: customer.id });
        goto("/customers");
      },
    });
  }

  function formatOrderId(id: string) {
    return id.slice(-8).toUpperCase();
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Customers", href: `/customers` },
      { label: customer?.name ?? "Customer" },
    ]}
  >
    {#snippet actions()}
      {#if customer}
        <Button variant="destructive" onclick={deleteCustomer}>
          <Trash2Icon class="size-4" />
          Delete
        </Button>
        <a
          href={`/customers/${params.id}/edit`}
          class={buttonVariants({ variant: "outline" })}
        >
          <PencilIcon class="size-4" />
          Edit
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
      <p class="text-red-500">Failed to load customer</p>
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
          Contact Information
        </h4>
        <div class="space-y-2 rounded-md border p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Customer Type</span>
            <span class="font-medium">{customer.customerType === "WHOLESALE"
                ? "Wholesale"
                : "Retail"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Contact Person</span>
            <span class="font-medium">{customer.contactName ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Phone</span>
            <span>{customer.phone ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Phone 2</span>
            <span>{customer.phone2 ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Email</span>
            <span>{customer.email ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">Address</span>
            <span class="max-w-xs text-right">{customer.address ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Tax ID</span>
            <span class="font-medium">{customer.taxId ?? "—"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Payment Terms</span>
            <span class="font-medium">{customer.paymentTerms ?? "—"}</span>
          </div>
          <div class="flex items-start justify-between">
            <span class="text-muted-foreground">Notes</span>
            <span class="max-w-xs whitespace-pre-wrap text-right">{customer.notes ?? "—"}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h4 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Orders</h4>

      {#if orders.isLoading}
        <div class="flex items-center justify-center py-12">
          <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
        </div>
      {:else if orders.isError}
        <div class="flex items-center justify-center py-12">
          <p class="text-red-500">Failed to load orders</p>
        </div>
      {:else if allOrders.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <p class="text-muted-foreground text-sm">No orders yet</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each allOrders as order (order.id)}
            <Card.Root class="overflow-hidden p-0">
              <Card.Content class="p-0">
                <a
                  href={`/orders/${order.id}`}
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
                    <p class="text-xs text-emerald-600">paid</p>
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
                Loading...
              {:else}
                Load More
              {/if}
            </Button>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</div>
