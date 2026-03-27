<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { createQuery } from "@tanstack/svelte-query";

  import InvoiceForm from "$lib/components/forms/InvoiceForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const invoiceQuery = createQuery(() =>
    orpc.purchaseInvoices.get.queryOptions({
      input: { slug: params.slug, invoiceId: params.invoiceId },
      enabled: !!params.invoiceId,
    })
  );
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Invoices", href: `/${shop.slug}/admin/purchases/invoices` },
      { label: "Edit Invoice" },
    ]}
  >
    {#snippet actions()}
      <Button variant="outline" onclick={() => history.back()}>
        <XIcon class="size-4" />
        Cancel
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Edit Invoice</h1>
      <p class="text-muted-foreground text-sm">Update invoice details and line items</p>
    </div>
  </div>

  {#if invoiceQuery.isLoading}
    <div class="flex items-center justify-center py-16">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if invoiceQuery.isError}
    <div class="flex items-center justify-center py-16">
      <p class="text-red-500">Failed to load invoice</p>
    </div>
  {:else if invoiceQuery.data}
    {@const invoice = invoiceQuery.data}

    <!-- Two Column Layout -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Left: Edit Form -->
      <div class="lg:col-start-1 lg:col-end-2">
        <InvoiceForm
          slug={params.slug}
          initialData={invoice}
          onSuccess={() => history.back()}
          onCancel={() => history.back()}
        />
      </div>

      <!-- Right: Invoice Photo -->
      <div class="lg:col-start-2 lg:col-end-3 lg:row-start-1">
        <Card.Root class="h-fit">
          <Card.Header>
            <Card.Title>Invoice Photo</Card.Title>
            <Card.Description>Original document</Card.Description>
          </Card.Header>
          <Card.Content>
            {#if invoice.photoUrl}
              <div class="overflow-hidden rounded-lg border">
                <img
                  src={invoice.photoUrl}
                  alt="Invoice {invoice.invoiceNumber}"
                  class="size-full object-contain"
                />
              </div>
            {:else}
              <div class="bg-muted flex aspect-[3/4] items-center justify-center rounded-lg border">
                <div class="text-muted-foreground flex flex-col items-center gap-2">
                  <CreditCardIcon class="size-12" />
                  <p class="text-sm">No photo available</p>
                </div>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Supplier Info Card -->
        {#if invoice.supplier}
          <Card.Root class="mt-4">
            <Card.Header>
              <Card.Title class="text-base">Supplier</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex items-center gap-2.5 text-sm">
                <div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
                  <Building2Icon class="text-primary size-4" />
                </div>
                <div>
                  <p class="font-medium">{invoice.supplier.name}</p>
                  <p class="text-muted-foreground text-xs">{invoice.supplier.id}</p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </div>
  {/if}
</div>
