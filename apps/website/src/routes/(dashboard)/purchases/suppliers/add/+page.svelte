<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  // svelte-ignore non_reactive_update
  let supplierFormRef: SupplierForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_suppliers(), href: `/purchases/suppliers` },
      { label: msg.ui_add_supplier() },
    ]}
  />

  <div class="max-w-2xl">
    <SupplierForm
      bind:this={supplierFormRef}
      onSuccess={() => goto(localizePath(`/purchases/suppliers`))}
    />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href={localizePath("/purchases/suppliers")} class={buttonVariants({ variant: "outline" })}>
        {msg.ui_cancel()}
      </a>
      <Button onclick={() => supplierFormRef?.submit()} disabled={supplierFormRef?.getIsPending()}>
        {#if supplierFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {msg.ui_creating()}
        {:else}
          {msg.ui_create_supplier()}
        {/if}
      </Button>
    </div>
  </div>
</div>
