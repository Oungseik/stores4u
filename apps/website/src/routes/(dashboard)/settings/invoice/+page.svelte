<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import {
    DEFAULT_INVOICE_CONFIG,
    type InvoiceConfig,
  } from "$lib/components/invoice/Invoice.svelte";
  import { orpc } from "$lib/orpc_client";

  import InvoiceSettingsForm from "./InvoiceSettingsForm.svelte";
  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const invoiceSettingsQuery = createQuery(() =>
    orpc.invoice.get.queryOptions({ input: {} }),
  );

  const updateInvoiceMutation = createMutation(() =>
    orpc.invoice.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Invoice settings updated");
        await invoiceSettingsQuery.refetch();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to update invoice settings");
      },
    }),
  );

  // Resolved config fed to the form as its initial seed. The form only mounts
  // inside the {:else} below, so this is already the saved row (or defaults).
  const initialConfig = $derived.by<InvoiceConfig>(() => {
    const s = invoiceSettingsQuery.data?.settings;
    if (!s) return { ...DEFAULT_INVOICE_CONFIG };
    return {
      paperWidth: s.paperWidth === "58" ? "58" : "80",
      showLogo: s.showLogo,
      showAddress: s.showAddress,
      showPhone: s.showPhone,
      showEmail: s.showEmail,
      footerText: s.footerText,
    };
  });

  async function save(config: InvoiceConfig) {
    await updateInvoiceMutation.mutateAsync(config);
  }
</script>

<section class="flex w-full max-w-4xl flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Settings", href: `/settings` },
      { label: "Invoice" },
    ]}
  />

  {#if invoiceSettingsQuery.isPending}
    <div class="flex items-center justify-center py-24">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if invoiceSettingsQuery.isError}
    <div class="flex items-center justify-center py-24">
      <p class="text-red-500">Failed to load invoice settings</p>
    </div>
  {:else}
    <InvoiceSettingsForm
      {initialConfig}
      currency={shop.currency}
      saving={updateInvoiceMutation.isPending}
      onsave={save}
    />
  {/if}
</section>
