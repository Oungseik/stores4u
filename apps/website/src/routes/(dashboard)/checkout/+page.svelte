<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import CheckIcon from "@lucide/svelte/icons/check";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import UserPlusIcon from "@lucide/svelte/icons/user-plus";
  import UsersIcon from "@lucide/svelte/icons/users";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as InputGroup from "@repo/ui/input-group";
  import { Spinner } from "@repo/ui/spinner";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { goto } from "$app/navigation";
  import { Debounced } from "runed";
  import { toast } from "svelte-sonner";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import CustomerForm, { type CreatedCustomer } from "$lib/components/forms/CustomerForm.svelte";
  import { cart } from "$lib/cart.svelte";
  import { orpc } from "$lib/orpc_client";
  import { formatPrice } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();
  const queryClient = useQueryClient();

  type CustomerMode = "walk-in" | "existing" | "new";
  const modes: { value: CustomerMode; label: string; icon: typeof UsersIcon }[] = [
    { value: "walk-in", label: "Walk-in", icon: ShoppingBagIcon },
    { value: "existing", label: "Existing", icon: SearchIcon },
    { value: "new", label: "New", icon: UserPlusIcon },
  ];

  let mode = $state<CustomerMode>("walk-in");
  let selectedCustomer = $state<CreatedCustomer | null>(null);

  // svelte-ignore non_reactive_update
  let customerFormRef: CustomerForm | null = $state(null);

  let searchQuery = $state("");
  const debouncedSearch = new Debounced(() => searchQuery, 300);
  const isDebouncing = $derived(searchQuery !== debouncedSearch.current);

  const customerSearch = createQuery(() =>
    orpc.customers.list.queryOptions({
      input: { search: debouncedSearch.current || undefined, pageSize: 10 },
      enabled: mode === "existing" && debouncedSearch.current.length > 0,
    }),
  );

  // Empty-cart guard: /checkout is reached via client nav from /cart. A direct
  // hit / refresh resets the in-memory cart, so bounce back to the POS.
  // Skip while a checkout is in flight or just succeeded — cart.clear() in
  // onSuccess would otherwise trigger this and hijack goto(/orders/[id]).
  $effect(() => {
    if (
      cart.items.length === 0 &&
      !checkoutMutation.isPending &&
      !checkoutMutation.isSuccess
    ) {
      goto("/cart");
    }
  });

  const checkoutMutation = createMutation(() =>
    orpc.products.checkout.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Order ${result.orderId}: ${result.itemCount} items for ${formatPrice(result.totalCents, shop.currency)}`,
        );
        cart.clear();
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.stats.key() });
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.revenueTrend.key() });
        queryClient.invalidateQueries({ queryKey: orpc.inventory.listMovements.key() });
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.key() });
        goto(`/orders/${result.orderId}`);
      },
      onError: (error) => {
        toast.error(error.message || "Checkout failed");
      },
    }),
  );

  function selectCustomer(customer: CreatedCustomer) {
    selectedCustomer = customer;
  }

  function changeCustomer() {
    selectedCustomer = null;
    mode = "existing";
    searchQuery = "";
  }

  function clearCustomer() {
    selectedCustomer = null;
    mode = "walk-in";
  }

  function handlePlaceOrder() {
    if (cart.items.length === 0) return;
    checkoutMutation.mutate({
      items: cart.items.map((item) => ({ productId: item.id, qty: item.quantity })),
      ...(selectedCustomer ? { customerId: selectedCustomer.id } : {}),
    });
  }
</script>

{#if cart.items.length === 0}
  <div class="text-muted-foreground p-6 text-sm">Your cart is empty. Redirecting…</div>
{:else}
  <div class="flex flex-col gap-6 p-4 md:p-6">
    <AdminDashboardHeader
      breadcrumbs={[
        { label: "Dashboard", href: `/` },
        { label: "Point of Sale", href: `/cart` },
        { label: "Checkout" },
      ]}
    >
      {#snippet actions()}
        <a href="/cart" class={buttonVariants({ variant: "outline" })}>
          <ArrowLeftIcon class="size-4" />
          Back to Cart
        </a>
      {/snippet}
    </AdminDashboardHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <!-- Order Items -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold tracking-tight">
            Order Items
            <span class="text-muted-foreground text-sm font-normal">({cart.totalItems})</span>
          </h2>
          <span class="text-muted-foreground text-sm">Edit quantities on the cart page</span>
        </div>

        <Card.Root class="overflow-hidden p-0">
          <Card.Content class="p-0">
            <div class="rounded-md border text-sm">
              {#each cart.items as item, i (item.id)}
                <div
                  class="flex items-center justify-between gap-3 p-2.5 {i !== cart.items.length - 1
                    ? 'border-b'
                    : ''}"
                >
                  <div class="flex min-w-0 items-center gap-2.5">
                    <div class="bg-muted flex size-8 shrink-0 items-center justify-center rounded">
                      {#if item.image}
                        <img
                          src={item.image}
                          alt={item.name}
                          class="size-full rounded object-cover"
                        />
                      {:else}
                        <PackageIcon class="text-muted-foreground size-4" />
                      {/if}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate">{item.name}</p>
                      <p class="text-muted-foreground text-xs">
                        {formatPrice(item.priceCents, shop.currency)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div class="shrink-0 text-right tabular-nums">
                    {formatPrice(item.priceCents * item.quantity, shop.currency)}
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      </section>

      <!-- Customer + Total + Place Order -->
      <aside class="space-y-4">
        <!-- Customer panel -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-base">
              <UsersIcon class="size-4" />
              Customer
            </Card.Title>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#if selectedCustomer}
              <!-- Selected customer -->
              <div class="flex items-start gap-3 rounded-lg border p-3">
                <div class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                  <span class="text-primary text-sm font-semibold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-2 font-medium">
                    <span class="truncate">{selectedCustomer.name}</span>
                    {#if selectedCustomer.customerType === "WHOLESALE"}
                      <span
                        class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium"
                      >
                        Wholesale
                      </span>
                    {/if}
                  </p>
                  {#if selectedCustomer.phone}
                    <p class="text-muted-foreground truncate text-sm">{selectedCustomer.phone}</p>
                  {/if}
                </div>
                <Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={clearCustomer} aria-label="Remove customer">
                  <XIcon class="size-4" />
                </Button>
              </div>
              <Button variant="outline" class="w-full" onclick={changeCustomer}>
                <SearchIcon class="size-4" />
                Change Customer
              </Button>
            {:else}
              <!-- Mode selector -->
              <div class="grid grid-cols-3 gap-1 rounded-lg border p-1">
                {#each modes as m (m.value)}
                  <button
                    type="button"
                    onclick={() => (mode = m.value)}
                    class="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors {mode ===
                    m.value
                      ? 'bg-primary text-primary-foreground hover:text-primary-foreground'
                      : ''}"
                  >
                    <m.icon class="size-4" />
                    {m.label}
                  </button>
                {/each}
              </div>

              {#if mode === "walk-in"}
                <p class="text-muted-foreground rounded-md bg-sky-50 p-3 text-sm text-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                  Walk-in sale — no customer record. The order will be saved anonymously.
                </p>
              {:else if mode === "existing"}
                <InputGroup.Root>
                  <InputGroup.Addon>
                    <SearchIcon />
                  </InputGroup.Addon>
                  <InputGroup.Input
                    bind:value={searchQuery}
                    placeholder="Search by name, contact, phone, or email..."
                  />
                </InputGroup.Root>

                {#if isDebouncing && searchQuery.length > 0}
                  <div class="flex justify-center py-4">
                    <Spinner class="text-muted-foreground size-5" />
                  </div>
                {:else if customerSearch.isLoading}
                  <div class="flex justify-center py-4">
                    <Spinner class="text-muted-foreground size-5" />
                  </div>
                {:else if searchQuery.length === 0}
                  <p class="text-muted-foreground py-2 text-center text-sm">
                    Start typing to search customers
                  </p>
                {:else if (customerSearch.data?.items ?? []).length === 0}
                  <p class="text-muted-foreground py-2 text-center text-sm">
                    No customers found. Try the "New" tab to create one.
                  </p>
                {:else}
                  <div class="max-h-72 space-y-1 overflow-y-auto">
                    {#each customerSearch.data?.items ?? [] as c (c.id)}
                      <button
                        type="button"
                        onclick={() => selectCustomer(c)}
                        class="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors"
                      >
                        <div class="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                          <span class="text-primary text-xs font-semibold">
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="flex items-center gap-2 text-sm font-medium">
                            <span class="truncate">{c.name}</span>
                            {#if c.customerType === "WHOLESALE"}
                              <span class="bg-primary/10 text-primary rounded px-1 py-0.5 text-[10px] font-medium">
                                Wholesale
                              </span>
                            {/if}
                          </p>
                          <p class="text-muted-foreground truncate text-xs">
                            {c.phone ?? c.email ?? c.contactName ?? "—"}
                          </p>
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              {:else}
                <!-- New customer -->
                <CustomerForm
                  bind:this={customerFormRef}
                  onSuccess={(created) => selectCustomer(created)}
                />
                <Button
                  class="w-full"
                  onclick={() => customerFormRef?.submit()}
                  disabled={customerFormRef?.getIsPending()}
                >
                  {#if customerFormRef?.getIsPending()}
                    <Loader2Icon class="size-4 animate-spin" />
                    Creating...
                  {:else}
                    <PlusIcon class="size-4" />
                    Create Customer
                  {/if}
                </Button>
              {/if}
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Total + Place Order -->
        <Card.Root>
          <Card.Content class="space-y-2 pt-6 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Items</span>
              <span>{cart.totalItems}</span>
            </div>
            <div class="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span class="tabular-nums">{formatPrice(cart.totalCents, shop.currency)}</span>
            </div>
            <p class="text-muted-foreground text-xs">Taxes, if any, are applied at checkout.</p>
            <Button
              class="w-full"
              onclick={handlePlaceOrder}
              disabled={checkoutMutation.isPending}
            >
              {#if checkoutMutation.isPending}
                <Spinner />
                Processing...
              {:else if selectedCustomer}
                <CheckIcon class="size-4" />
                Place Order — {selectedCustomer.name}
              {:else}
                <CheckIcon class="size-4" />
                Place Order — Walk-in
              {/if}
            </Button>
          </Card.Content>
        </Card.Root>
      </aside>
    </div>
  </div>
{/if}
