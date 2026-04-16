<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import UserIcon from "@lucide/svelte/icons/user";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Alert from "@repo/ui/alert";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { Separator } from "@repo/ui/separator";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import InvoicePreviewCard from "$lib/components/cards/InvoicePreviewCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params }: PageProps = $props();

  const invoiceFileQuery = createQuery(() =>
    orpc.purchaseInvoices.getFile.queryOptions({
      input: { slug: params.slug, invoiceFileId: params.invoiceFileId },
    })
  );

  const invoiceQuery = createQuery(() =>
    orpc.purchaseInvoices.getInvoice.queryOptions({
      input: { slug: params.slug, invoiceFileId: params.invoiceFileId },
    })
  );

  const isLoading = $derived(invoiceQuery.isLoading || invoiceFileQuery.isLoading);

  const error = $derived(invoiceQuery.error || invoiceFileQuery.error || null);

  const fileStatus = $derived(invoiceFileQuery.data?.status);
  const isRejected = $derived(fileStatus === "REJECTED");

  const rejectionReason = $derived(
    invoiceQuery.data?.ocrResult?.rejectionReason ??
      invoiceFileQuery.data?.ocrResult?.rejectionReason ??
      null
  );

  const downloadMutation = createMutation(() =>
    orpc.purchaseInvoices.downloadFile.mutationOptions({
      onSuccess: (data) => {
        window.open(data.downloadUrl, "_blank");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate download link");
      },
    })
  );

  function handleDownload() {
    downloadMutation.mutate({ slug: params.slug, fileId: params.invoiceFileId });
  }

  const breadcrumbLabel = $derived(isRejected ? "Rejected Invoice" : "Invoice Details");

  const supplier = $derived(invoiceQuery.data?.supplier);
  const items = $derived(invoiceQuery.data?.items ?? []);
  const subtotalCents = $derived(invoiceQuery.data?.subtotalCents ?? 0);
  const totalCents = $derived(invoiceQuery.data?.totalCents ?? 0);

  const extractedData = $derived(invoiceFileQuery.data?.ocrResult?.extractedData);

  const extractedItems = $derived(extractedData?.items ?? []);
  const extractedSupplier = $derived(extractedData?.supplier);
  const extractedInvoice = $derived(extractedData?.invoice);
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${params.slug}/dashboard` },
      { label: "Invoice Files", href: `/${params.slug}/dashboard/purchases/invoices` },
      { label: breadcrumbLabel },
    ]}
  >
    {#snippet actions()}
      <Button variant="outline" onclick={handleDownload}>
        <DownloadIcon class="size-4" />
        Download Invoice
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  {#if isLoading}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2Icon class="text-muted-foreground size-8 animate-spin" />
      <p class="text-muted-foreground">Loading invoice data...</p>
    </div>
  {:else if error}
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <XIcon class="text-destructive size-12" />
      <div class="text-center">
        <p class="text-lg font-semibold">Error Loading Invoice</p>
        <p class="text-muted-foreground">{error?.message ?? "Invoice not found"}</p>
      </div>
      <Button variant="outline" onclick={() => history.back()}>Go Back</Button>
    </div>
  {:else}
    {#if isRejected}
      <Alert.Root variant="destructive">
        <AlertTriangleIcon class="size-4" />
        <Alert.Title>Invoice Was Rejected</Alert.Title>
        <Alert.Description>
          {#if rejectionReason}
            <p class="mb-2">{rejectionReason}</p>
          {/if}
          <p class="text-sm">
            This invoice was rejected during AI processing. The extracted data below is for
            reference only.
          </p>
        </Alert.Description>
      </Alert.Root>
    {/if}

    <div class="grid gap-6 lg:grid-cols-2">
      <Card.Root class="h-fit lg:hidden">
        <Card.Header>
          <Card.Title>Invoice Preview</Card.Title>
          <Card.Description>View original document on larger screen.</Card.Description>
        </Card.Header>
        <Card.Content>
          {#if invoiceQuery.data?.file?.imageUrl}
            <a
              href={invoiceQuery.data.file.imageUrl}
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
        class="hidden lg:block"
        imageUrl={invoiceQuery.data?.file?.imageUrl}
        fileType={invoiceQuery.data?.file?.fileType}
      />

      <div class="flex flex-col gap-6 lg:col-start-1 lg:col-end-2 lg:row-start-1">
        {#if isRejected}
          {#if extractedSupplier}
            <Card.Root>
              <Card.Header>
                <Card.Title class="flex items-center gap-2">
                  <UserIcon class="size-4" />
                  Extracted Supplier
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Name</span>
                    <span class="font-medium">{extractedSupplier.name}</span>
                  </div>
                  {#if extractedSupplier.contactName}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Contact</span>
                      <span>{extractedSupplier.contactName}</span>
                    </div>
                  {/if}
                  {#if extractedSupplier.phone}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Phone</span>
                      <span>{extractedSupplier.phone}</span>
                    </div>
                  {/if}
                  {#if extractedSupplier.email}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Email</span>
                      <span>{extractedSupplier.email}</span>
                    </div>
                  {/if}
                  {#if extractedSupplier.address}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Address</span>
                      <span class="max-w-[60%] text-right">{extractedSupplier.address}</span>
                    </div>
                  {/if}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}

          {#if extractedItems.length > 0}
            <Card.Root class="pb-0">
              <Card.Header>
                <Card.Title class="flex items-center gap-2">
                  <PackageIcon class="size-4" />
                  Extracted Items ({extractedItems.length})
                </Card.Title>
              </Card.Header>
              <Card.Content class="p-0">
                <div class="divide-y">
                  {#each extractedItems as item, i (i)}
                    <div class="flex flex-col gap-2 p-3 text-sm lg:flex-row lg:items-center">
                      <div class="flex-1">
                        <span class="font-medium">{item.productName}</span>
                        {#if item.sku}
                          <span class="text-muted-foreground ml-2 text-xs">({item.sku})</span>
                        {/if}
                      </div>
                      <div class="text-muted-foreground flex items-center gap-2 tabular-nums">
                        <span>{item.quantity} x</span>
                        <span>{formatPrice(item.unitCostCents)}</span>
                        <span>=</span>
                        <span class="text-foreground font-medium"
                          >{formatPrice(item.lineTotalCents)}</span
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}

          {#if extractedInvoice}
            <Card.Root>
              <Card.Header>
                <Card.Title>Extracted Invoice Details</Card.Title>
              </Card.Header>
              <Card.Content class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-muted-foreground">Invoice Number</span>
                    <p class="font-medium">{extractedInvoice.invoiceNumber || "-"}</p>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Invoice Date</span>
                    <p class="font-medium">{extractedInvoice.invoiceDate || "-"}</p>
                  </div>
                </div>

                <div class="space-y-2 rounded-lg border p-4 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Subtotal</span>
                    <div>{formatPrice(extractedInvoice.subtotalCents ?? 0)}</div>
                  </div>
                  {#if (extractedInvoice.vatCents ?? 0) > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">VAT</span>
                      <div>{formatPrice(extractedInvoice.vatCents ?? 0)}</div>
                    </div>
                  {/if}
                  {#if (extractedInvoice.discountCents ?? 0) > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Discount</span>
                      <div>{formatPrice(extractedInvoice.discountCents ?? 0)}</div>
                    </div>
                  {/if}
                  {#if (extractedInvoice.freightCents ?? 0) > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Freight</span>
                      <div>{formatPrice(extractedInvoice.freightCents ?? 0)}</div>
                    </div>
                  {/if}
                  <Separator />
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">Total</span>
                    <div class="font-semibold">{formatPrice(extractedInvoice.totalCents ?? 0)}</div>
                  </div>
                </div>

                {#if extractedInvoice.notes}
                  <div>
                    <span class="text-muted-foreground text-sm">Notes</span>
                    <p class="mt-1 text-sm">{extractedInvoice.notes}</p>
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>
          {/if}
        {:else}
          {#if supplier}
            <Card.Root>
              <Card.Header>
                <Card.Title class="flex items-center gap-2">
                  <UserIcon class="size-4" />
                  Supplier
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Name</span>
                    <span class="font-medium">{supplier.name}</span>
                  </div>
                  {#if supplier.contactName}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Contact</span>
                      <span>{supplier.contactName}</span>
                    </div>
                  {/if}
                  {#if supplier.phone}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Phone</span>
                      <span>{supplier.phone}</span>
                    </div>
                  {/if}
                  {#if supplier.phone2}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Phone 2</span>
                      <span>{supplier.phone2}</span>
                    </div>
                  {/if}
                  {#if supplier.email}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Email</span>
                      <span>{supplier.email}</span>
                    </div>
                  {/if}
                  {#if supplier.address}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Address</span>
                      <span class="max-w-[60%] text-right">{supplier.address}</span>
                    </div>
                  {/if}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}

          <Card.Root class="pb-0">
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <PackageIcon class="size-4" />
                Items ({items.length})
              </Card.Title>
            </Card.Header>
            <Card.Content class="p-0">
              {#if items.length === 0}
                <div
                  class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12"
                >
                  <PackageIcon class="size-10 opacity-50" />
                  <p class="text-sm">No items</p>
                </div>
              {:else}
                <div class="divide-y">
                  {#each items as item (item.id)}
                    <div class="flex flex-col gap-2 p-3 text-sm lg:flex-row lg:items-center">
                      <div class="flex-1">
                        <span class="font-medium">{item.invoiceItemName}</span>
                        <span class="opacity-60">({item.product?.sku})</span>
                      </div>
                      <div class="text-muted-foreground flex items-center gap-2 tabular-nums">
                        <span>{item.qty} x</span>
                        <span>{formatPrice(item.unitCostCents)}</span>
                        <span>=</span>
                        <span class="text-foreground font-medium"
                          >{formatPrice(item.lineTotalCents)}</span
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </Card.Content>
          </Card.Root>

          {#if invoiceQuery.data}
            <Card.Root>
              <Card.Header>
                <Card.Title>Invoice Details</Card.Title>
              </Card.Header>
              <Card.Content class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-muted-foreground">Invoice Number</span>
                    <p class="font-medium">{invoiceQuery.data.invoiceNumber}</p>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Invoice Date</span>
                    <p class="font-medium">{invoiceQuery.data.invoiceDate}</p>
                  </div>
                </div>

                <div class="space-y-2 rounded-lg border p-4 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-muted-foreground">Subtotal</span>
                    <div>{formatPrice(subtotalCents)}</div>
                  </div>
                  {#if invoiceQuery.data.vatCents > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">VAT</span>
                      <div>{formatPrice(invoiceQuery.data.vatCents)}</div>
                    </div>
                  {/if}
                  {#if invoiceQuery.data.discountCents > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Discount</span>
                      <div>{formatPrice(invoiceQuery.data.discountCents)}</div>
                    </div>
                  {/if}
                  {#if invoiceQuery.data.freightCents > 0}
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">Freight</span>
                      <div>{formatPrice(invoiceQuery.data.freightCents)}</div>
                    </div>
                  {/if}
                  <Separator />
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">Total</span>
                    <div class="font-semibold">{formatPrice(totalCents)}</div>
                  </div>
                </div>

                {#if invoiceQuery.data.notes}
                  <div>
                    <span class="text-muted-foreground text-sm">Notes</span>
                    <p class="mt-1 text-sm">{invoiceQuery.data.notes}</p>
                  </div>
                {/if}

                <div class="text-muted-foreground flex items-center justify-between text-xs">
                  <span
                    >Validated: {invoiceQuery.data.validatedAt
                      ? new Date(invoiceQuery.data.validatedAt).toLocaleString()
                      : "-"}</span
                  >
                  <span>Created: {new Date(invoiceQuery.data.createdAt).toLocaleString()}</span>
                </div>
              </Card.Content>
            </Card.Root>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
