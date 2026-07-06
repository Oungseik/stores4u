<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import { Button, buttonVariants } from "@repo/ui/button";

  import { goto } from "$app/navigation";
  import CustomerForm from "$lib/components/forms/CustomerForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  // svelte-ignore non_reactive_update
  let customerFormRef: CustomerForm | null = null;
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/` },
      { label: "Customers", href: `/customers` },
      { label: "Add Customer" },
    ]}
  />

  <div class="max-w-2xl">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Add Customer</h1>
      <p class="text-muted-foreground text-sm">Create a new customer for your shop</p>
    </div>

    <CustomerForm bind:this={customerFormRef} onSuccess={() => goto(`/customers`)} />

    <div class="flex items-center gap-2 border-t pt-4">
      <a href={`/customers`} class={buttonVariants({ variant: "outline" })}> Cancel </a>
      <Button onclick={() => customerFormRef?.submit()} disabled={customerFormRef?.getIsPending()}>
        {#if customerFormRef?.getIsPending()}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Creating...
        {:else}
          Create Customer
        {/if}
      </Button>
    </div>
  </div>
</div>
