<script lang="ts">
  import { localizePath } from "$lib/localize-path";
  import * as msg from "$lib/paraglide/messages";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import CustomerForm from "$lib/components/forms/CustomerForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  let customerFormRef: CustomerForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_customers(), href: `/customers` },
      { label: msg.ui_add_customer() },
    ]}
  />

  <div class="max-w-2xl">
    <CustomerForm bind:this={customerFormRef} onSuccess={() => goto(localizePath(`/customers`))} />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href={localizePath("/customers")} class={buttonVariants({ variant: "outline" })}>
        {msg.ui_cancel()}
      </a>
      <Button onclick={() => customerFormRef?.submit()} disabled={customerFormRef?.getIsPending()}>
        {#if customerFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          {msg.ui_creating()}
        {:else}
          {msg.ui_create_customer()}
        {/if}
      </Button>
    </div>
  </div>
</div>
