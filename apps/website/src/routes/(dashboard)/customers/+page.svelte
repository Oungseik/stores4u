<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import UsersIcon from "@lucide/svelte/icons/users";
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
  import { customersFilterSchema } from "$lib/search_param";
  import type { CustomerType } from "$lib/server/db";
  import { formatDate, formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.customers.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Customer deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.customers.get.key() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete customer");
      },
    }),
  );

  type ApiCustomer = {
    id: string;
    name: string;
    customerType: CustomerType;
    contactName: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    address: string | null;
    taxId: string | null;
    paymentTerms: string | null;
    notes: string | null;
    ordersCount: number;
    totalSpent: number;
    lastOrder: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const searchParams = useSearchParams(customersFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const customers = createInfiniteQuery(() =>
    orpc.customers.list.infiniteOptions({
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

  const allCustomers = $derived(customers.data?.pages.flatMap((page) => page.items) ?? []);

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  function deleteCustomer(customer: ApiCustomer) {
    confirmDelete({
      title: "Delete Customer",
      description: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync({ id: customer.id });
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader breadcrumbs={[{ label: "Dashboard", href: `/` }, { label: "Customers" }]}>
    {#snippet actions()}
      <a href="/customers/add" class={buttonVariants()}>
        <PlusIcon class="size-4" />
        Add Customer
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">Customers</h1>
    <p class="text-muted-foreground text-sm">Manage customer information and order history</p>
  </div>

  <section class="space-y-6 @container/main">
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <FilterBar.Search
        placeholder="Search customers by name, contact, phone, or email..."
        value={searchParams.search}
        oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
      />
      <FilterBar.Reset />
    </FilterBar.Root>

    {#if customers.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if customers.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load customers</p>
      </div>
    {:else if allCustomers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <UsersIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">No customers found</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters ? "Try clearing filters" : "Add your first customer to get started"}
        </p>
      </div>
    {:else}
      <!-- Customers Grid -->
      <div class="grid grid-cols-1 gap-4 @[340px]/main:grid-cols-2 @[680px]/main:grid-cols-3">
        {#each allCustomers as customer (customer.id)}
          <Card.Root class="group transition-all duration-200 hover:shadow-md">
            <Card.Header>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                    <UsersIcon class="text-primary size-5" />
                  </div>
                  <div>
                    <Card.Title class="text-base">
                      {customer.name}
                      {#if customer.customerType === "WHOLESALE"}
                        <span
                          class="bg-primary/10 text-primary ml-2 rounded px-1.5 py-0.5 align-middle text-xs font-medium"
                        >
                          Wholesale
                        </span>
                      {/if}
                    </Card.Title>
                    {#if customer.contactName}
                      <Card.Description class="flex items-center gap-1">
                        <UserIcon class="size-3" />
                        {customer.contactName}
                      </Card.Description>
                    {/if}
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Content class="space-y-3">
              <div class="space-y-1 text-sm">
                {#if customer.email}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <MailIcon class="size-3" />
                    <a href={`mailto:${customer.email}`} class="truncate hover:underline"
                      >{customer.email}</a
                    >
                  </div>
                {/if}
                {#if customer.phone}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon class="size-3" />
                    <a href={`tel:${customer.phone}`} class="hover:underline">{customer.phone}</a>
                  </div>
                {/if}
                {#if customer.phone2}
                  <div class="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon class="size-3" />
                    <a href={`tel:${customer.phone2}`} class="hover:underline">{customer.phone2}</a>
                  </div>
                {/if}
              </div>

              <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">Total Spent</p>
                  <p class="font-semibold">{formatPrice(customer.totalSpent, shop.currency)}</p>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-xs">Orders</p>
                  <p class="font-semibold">{customer.ordersCount}</p>
                </div>
              </div>

              {#if customer.lastOrder}
                <div class="text-muted-foreground flex items-center gap-2 text-xs">
                  <ReceiptIcon class="size-3" />
                  Last order: {formatDate(customer.lastOrder)}
                </div>
              {/if}
            </Card.Content>
            <Card.Footer class="flex flex-col gap-2 pt-0">
              <Button variant="outline" class="w-full" href={`/customers/${customer.id}`}>
                View Details
              </Button>
              <div class="flex w-full gap-2">
                <Button
                  variant="destructive"
                  class="flex-1"
                  onclick={() => deleteCustomer(customer)}
                >
                  <Trash2Icon class="size-4" />
                  Delete
                </Button>
                <a
                  href={`/customers/${customer.id}/edit`}
                  class={buttonVariants({ variant: "outline", class: "flex-1" })}
                >
                  <PencilIcon class="size-4" />
                  Edit
                </a>
              </div>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>

      {#if customers.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => customers.fetchNextPage()}
            disabled={customers.isFetchingNextPage}
          >
            {#if customers.isFetchingNextPage}
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
</div>
