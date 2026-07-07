<script lang="ts">
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
      { label: "Dashboard", href: `/` },
      { label: "Suppliers", href: `/purchases/suppliers` },
      { label: "Add Supplier" },
    ]}
  />

  <div class="max-w-2xl">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Add Supplier</h1>
      <p class="text-muted-foreground text-sm">Create a new supplier for your shop</p>
    </div>

    <SupplierForm bind:this={supplierFormRef} onSuccess={() => goto(`/purchases/suppliers`)} />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href="/purchases/suppliers" class={buttonVariants({ variant: "outline" })}> Cancel </a>
      <Button onclick={() => supplierFormRef?.submit()} disabled={supplierFormRef?.getIsPending()}>
        {#if supplierFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Creating...
        {:else}
          Create Supplier
        {/if}
      </Button>
    </div>
  </div>
</div>
