<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
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
  const queryClient = useQueryClient();

  const invoiceSettingsQuery = createQuery(() => orpc.invoice.get.queryOptions({ input: {} }));

  const updateInvoiceMutation = createMutation(() =>
    orpc.invoice.update.mutationOptions({
      onSuccess: async () => {
        toast.success(msg.ui_invoice_settings_updated());
        await queryClient.invalidateQueries({ queryKey: orpc.invoice.key() });
      },
      onError: (error: { message?: string }) => {
        toast.error(localizeError(error, "ui_failed_to_update_invoice_settings"));
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

<section class="flex w-full flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_settings(), href: `/settings` },
      { label: msg.ui_invoice() },
    ]}
  />

  <div class="w-full max-w-4xl">
    {#if invoiceSettingsQuery.isPending}
      <div class="flex items-center justify-center py-24">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if invoiceSettingsQuery.isError}
      <div class="flex items-center justify-center py-24">
        <p class="text-red-500">{msg.ui_failed_to_load_invoice_settings()}</p>
      </div>
    {:else}
      <InvoiceSettingsForm
        {initialConfig}
        currency={shop.currency}
        shopDetails={{
          shopName: shop.name,
          description: shop.description,
          logo: shop.logo,
          address: shop.address,
          city: shop.city,
          state: shop.state,
          zipCode: shop.zipCode,
          phone: shop.phone,
          email: shop.email,
        }}
        saving={updateInvoiceMutation.isPending}
        onsave={save}
      />
    {/if}
  </div>
</section>
