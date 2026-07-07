<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import { createQuery } from "@tanstack/svelte-query";

  import { goto } from "$app/navigation";
  import CustomerForm from "$lib/components/forms/CustomerForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const customerQuery = createQuery(() =>
    orpc.customers.get.queryOptions({
      input: { customerId: params.id },
    }),
  );

  const customer = $derived(customerQuery.data);

  // svelte-ignore non_reactive_update
  let customerFormRef: CustomerForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Customers", href: `/customers` },
      { label: customer?.name ?? "Customer", href: `/customers/${params.id}` },
      { label: "Edit" },
    ]}
  />

  {#if customerQuery.isLoading}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if customerQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load customer</p>
    </div>
  {:else if customer}
    <div class="max-w-2xl">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Edit Customer</h1>
        <p class="text-muted-foreground text-sm">Update customer details</p>
      </div>

      <CustomerForm
        bind:this={customerFormRef}
        initialData={{
          id: customer.id,
          name: customer.name,
          customerType: customer.customerType,
          contactName: customer.contactName,
          phone: customer.phone,
          phone2: customer.phone2,
          email: customer.email,
          address: customer.address,
          taxId: customer.taxId,
          paymentTerms: customer.paymentTerms,
          notes: customer.notes,
        }}
        onSuccess={() => goto(`/customers/${params.id}`)}
      />

      <div class="flex items-center gap-2 border-t pt-4">
        <a href={`/customers/${params.id}`} class={buttonVariants({ variant: "outline" })}>
          Cancel
        </a>
        <Button
          onclick={() => customerFormRef?.submit()}
          disabled={customerFormRef?.getIsPending()}
        >
          {#if customerFormRef?.getIsPending()}
            <Loader2Icon class="mr-2 size-4 animate-spin" />
            Updating...
          {:else}
            Update Customer
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>
