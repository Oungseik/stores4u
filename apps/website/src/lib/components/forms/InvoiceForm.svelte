<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import * as Popover from "@repo/ui/popover";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import * as Select from "@repo/ui/select";
  import { Separator } from "@repo/ui/separator";
  import { Textarea } from "@repo/ui/textarea";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import { orpc } from "$lib/orpc_client";
  import { calculateLineTotal, calculateTotal } from "$lib/utils/price_calculation";

  interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    qty: number;
    unitCostCents: number;
  }

  interface InvoiceInitialData {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    supplier: { id: string; name: string } | null;
    invoiceDate: string;
    photoUrl: string;
    subtotalCents: number;
    vatCents: number;
    discountCents: number;
    freightCents: number;
    totalCents: number;
    notes: string | null;
    status: "PENDING" | "VALIDATED" | "REJECTED" | "AUTO_ACCEPTED";
    items: {
      id: string;
      productId: string;
      product: { id: string; name: string; sku: string } | null;
      qty: number;
      unitCostCents: number;
      lineTotalCents: number;
      lineSubtotalCents: number;
    }[];
  }

  interface Props {
    slug: string;
    initialData: InvoiceInitialData;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { slug, initialData, onSuccess, onCancel }: Props = $props();

  const queryClient = useQueryClient();

  // Items state (managed separately from tanstack form)
  // svelte-ignore state_referenced_locally
  let items = $state<InvoiceItem[]>(
    initialData.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? "",
      productSku: item.product?.sku ?? "",
      qty: item.qty,
      unitCostCents: item.unitCostCents,
    }))
  );

  // UI state
  let supplierOpen = $state(false);
  let productSearchOpen = $state<string | null>(null);
  let productSearch = $state("");

  const debouncedProductSearch = new Debounced(() => productSearch, 300);

  // Suppliers query
  const suppliersQuery = createQuery(() =>
    orpc.suppliers.list.queryOptions({
      input: { slug, pageSize: 100 },
      enabled: supplierOpen,
    })
  );

  // Products query (for item product search)
  const productsQuery = createQuery(() =>
    orpc.products.list.queryOptions({
      input: { slug, pageSize: 20, search: debouncedProductSearch.current || undefined },
      enabled: !!productSearchOpen,
    })
  );

  const suppliers = $derived(suppliersQuery.data?.items ?? []);
  const products = $derived(productsQuery.data?.items ?? []);

  // Selected supplier state
  // svelte-ignore state_referenced_locally
  let selectedSupplierId = $state(initialData.supplierId);
  // svelte-ignore state_referenced_locally
  let selectedSupplierName = $state(initialData.supplier?.name ?? "");

  // Computed values
  const subtotalCents = $derived(
    items.reduce((sum, item) => sum + calculateLineTotal(item.qty, item.unitCostCents), 0)
  );

  // Form
  const form = createForm(() => ({
    defaultValues: {
      invoiceNumber: initialData.invoiceNumber,
      invoiceDate: initialData.invoiceDate,
      status: initialData.status,
      vatCents: initialData.vatCents,
      discountCents: initialData.discountCents,
      freightCents: initialData.freightCents,
      notes: initialData.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      if (items.length === 0) {
        toast.error("At least one item is required");
        return;
      }

      if (!selectedSupplierId) {
        toast.error("Please select a supplier");
        return;
      }

      const totalCents = calculateTotal(
        subtotalCents,
        value.vatCents,
        value.discountCents,
        value.freightCents
      );

      updateInvoice.mutate({
        slug,
        id: initialData.id,
        invoiceNumber: value.invoiceNumber,
        supplierId: selectedSupplierId,
        invoiceDate: value.invoiceDate,
        photoUrl: initialData.photoUrl,
        subtotalCents,
        vatCents: value.vatCents,
        discountCents: value.discountCents,
        freightCents: value.freightCents,
        totalCents,
        notes: value.notes || null,
        status: value.status,
        items: items.map((item) => ({
          productId: item.productId,
          invoiceItemName: item.productName,
          qty: item.qty,
          unitCostCents: item.unitCostCents,
          lineSubtotalCents: calculateLineTotal(item.qty, item.unitCostCents),
          lineTotalCents: calculateLineTotal(item.qty, item.unitCostCents),
          vatCents: 0,
          discountCents: 0,
          freightCents: 0,
        })),
      });
    },
  }));

  const updateInvoice = createMutation(() =>
    orpc.purchaseInvoices.update.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice updated successfully");
        queryClient.invalidateQueries({ queryKey: orpc.purchaseInvoices.list.key() });
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update invoice");
      },
    })
  );

  // Item actions
  function addItem() {
    items = [
      ...items,
      {
        id: `item-${Date.now()}`,
        productId: "",
        productName: "",
        productSku: "",
        qty: 1,
        unitCostCents: 0,
      },
    ];
  }

  function removeItem(itemId: string) {
    items = items.filter((i) => i.id !== itemId);
  }

  function selectProduct(itemId: string, product: { id: string; name: string; sku: string }) {
    items = items.map((i) =>
      i.id === itemId
        ? { ...i, productId: product.id, productName: product.name, productSku: product.sku }
        : i
    );
    productSearchOpen = null;
    productSearch = "";
  }

  function selectSupplier(supplier: { id: string; name: string }) {
    selectedSupplierId = supplier.id;
    selectedSupplierName = supplier.name;
    supplierOpen = false;
  }

  function formatCents(cents: number) {
    return (cents / 100).toFixed(2);
  }
</script>

<form
  class="space-y-6"
  onsubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }}
>
  <!-- Supplier -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-base">Supplier</Card.Title>
    </Card.Header>
    <Card.Content>
      <Popover.Root bind:open={supplierOpen}>
        <Popover.Trigger
          class="border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        >
          <span class="truncate">{selectedSupplierName || "Select supplier..."}</span>
          <ChevronDownIcon class="size-4 opacity-50" />
        </Popover.Trigger>
        <Popover.Content class="w-[300px] p-0" align="start">
          <Command.Root>
            <Command.Input placeholder="Search suppliers..." />
            <Command.List>
              <Command.Empty>
                {suppliersQuery.isLoading ? "Loading..." : "No suppliers found."}
              </Command.Empty>
              {#each suppliers as supplier}
                <Command.Item value={supplier.name} onSelect={() => selectSupplier(supplier)}>
                  <CheckIcon
                    class={["size-4", selectedSupplierId !== supplier.id && "text-transparent"]}
                  />
                  <div class="flex flex-col">
                    <span>{supplier.name}</span>
                    {#if supplier.contactName}
                      <span class="text-muted-foreground text-xs">{supplier.contactName}</span>
                    {/if}
                  </div>
                </Command.Item>
              {/each}
            </Command.List>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>
    </Card.Content>
  </Card.Root>

  <!-- Invoice Items -->
  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between">
      <Card.Title class="flex items-center gap-2 text-base">
        <PackageIcon class="size-4" />
        Items ({items.length})
      </Card.Title>
      <Button type="button" variant="outline" size="sm" onclick={addItem}>
        <PlusIcon class="size-4" />
        Add Item
      </Button>
    </Card.Header>
    <Card.Content class="p-0">
      <ScrollArea class="max-h-96">
        <table class="w-full text-sm">
          <thead class="bg-muted sticky top-0">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Product</th>
              <th class="w-24 px-4 py-3 text-center font-medium">Qty</th>
              <th class="w-32 px-4 py-3 text-right font-medium">Unit Cost</th>
              <th class="w-32 px-4 py-3 text-right font-medium">Total</th>
              <th class="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr class="hover:bg-muted/50 border-b last:border-b-0">
                <!-- Product -->
                <td class="px-4 py-2">
                  <Popover.Root open={productSearchOpen === item.id}>
                    <Popover.Trigger
                      class="w-full"
                      onclick={() => {
                        productSearchOpen = productSearchOpen === item.id ? null : item.id;
                        productSearch = "";
                      }}
                    >
                      <div
                        class="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left"
                      >
                        {#if item.productId}
                          <div class="flex flex-col">
                            <span class="font-medium">{item.productName}</span>
                            <span class="text-muted-foreground text-xs">{item.productSku}</span>
                          </div>
                        {:else}
                          <span class="text-muted-foreground italic">Select product...</span>
                        {/if}
                      </div>
                    </Popover.Trigger>
                    <Popover.Content class="w-72 p-0" align="start">
                      <Command.Root>
                        <Command.Input
                          placeholder="Search products..."
                          value={productSearch}
                          oninput={(e) => (productSearch = e.currentTarget.value)}
                        />
                        <Command.List>
                          <Command.Empty>
                            {productsQuery.isLoading ? "Loading..." : "No products found."}
                          </Command.Empty>
                          {#each products as product}
                            <Command.Item
                              value={product.name}
                              onSelect={() => selectProduct(item.id, product)}
                            >
                              <CheckIcon
                                class={[
                                  "size-4",
                                  item.productId !== product.id && "text-transparent",
                                ]}
                              />
                              <div class="flex flex-col">
                                <span>{product.name}</span>
                                <span class="text-muted-foreground text-xs">{product.sku}</span>
                              </div>
                            </Command.Item>
                          {/each}
                        </Command.List>
                      </Command.Root>
                    </Popover.Content>
                  </Popover.Root>
                </td>

                <!-- Qty -->
                <td class="px-4 py-2">
                  <Input
                    type="number"
                    value={item.qty}
                    onchange={(e) => {
                      const val = Number.parseFloat(e.currentTarget.value) || 0;
                      items = items.map((i) => (i.id === item.id ? { ...i, qty: val } : i));
                    }}
                    class="w-20 text-center"
                    min={0}
                    step={1}
                  />
                </td>

                <!-- Unit Cost -->
                <td class="px-4 py-2 text-right">
                  <Input
                    type="number"
                    value={item.unitCostCents / 100}
                    onchange={(e) => {
                      const val = Math.round((Number.parseFloat(e.currentTarget.value) || 0) * 100);
                      items = items.map((i) =>
                        i.id === item.id ? { ...i, unitCostCents: val } : i
                      );
                    }}
                    class="w-28 text-right"
                    min={0}
                    step={0.01}
                  />
                </td>

                <!-- Line Total (calculated) -->
                <td class="px-4 py-2 text-right font-medium">
                  {formatCents(calculateLineTotal(item.qty, item.unitCostCents))}
                </td>

                <!-- Remove -->
                <td class="px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="size-8 text-red-500 hover:text-red-700"
                    onclick={() => removeItem(item.id)}
                  >
                    <Trash2Icon class="size-4" />
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </ScrollArea>
    </Card.Content>
  </Card.Root>

  <!-- Invoice Details -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-base">Invoice Details</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <form.Field
          name="invoiceNumber"
          validators={{
            onChange: ({ value }) =>
              z.string().min(1, "Required").max(100).safeParse(value).error?.issues.at(0)?.message,
          }}
        >
          {#snippet children(field)}
            <div class="space-y-2">
              <Label for={field.name}>Invoice Number</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onblur={field.handleBlur}
                onchange={(e) => field.handleChange(e.currentTarget.value)}
              />
              {#if field.state.meta.errors.length}
                <p class="text-sm text-red-500">{field.state.meta.errors}</p>
              {/if}
            </div>
          {/snippet}
        </form.Field>

        <form.Field
          name="invoiceDate"
          validators={{
            onChange: ({ value }) =>
              z.string().min(1, "Required").safeParse(value).error?.issues.at(0)?.message,
          }}
        >
          {#snippet children(field)}
            <div class="space-y-2">
              <Label for={field.name}>Invoice Date</Label>
              <Input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onblur={field.handleBlur}
                onchange={(e) => field.handleChange(e.currentTarget.value)}
              />
              {#if field.state.meta.errors.length}
                <p class="text-sm text-red-500">{field.state.meta.errors}</p>
              {/if}
            </div>
          {/snippet}
        </form.Field>
      </div>

      <form.Field name="status">
        {#snippet children(field)}
          <div class="space-y-2">
            <Label>Status</Label>
            <Select.Root
              type="single"
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
            >
              <Select.Trigger class="w-full">
                {field.state.value === "PENDING"
                  ? "Pending"
                  : field.state.value === "VALIDATED"
                    ? "Validated"
                    : field.state.value === "AUTO_ACCEPTED"
                      ? "Auto Accepted"
                      : field.state.value === "REJECTED"
                        ? "Rejected"
                        : "Select status"}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="PENDING">Pending</Select.Item>
                <Select.Item value="VALIDATED">Validated</Select.Item>
                <Select.Item value="AUTO_ACCEPTED">Auto Accepted</Select.Item>
                <Select.Item value="REJECTED">Rejected</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        {/snippet}
      </form.Field>

      <!-- Financial Fields -->
      <div class="space-y-2 rounded-lg border p-4">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Subtotal</span>
          <span class="font-medium">{formatCents(subtotalCents)}</span>
        </div>

        <form.Field name="vatCents">
          {#snippet children(field)}
            <div class="flex items-center justify-between">
              <Label for={field.name} class="text-muted-foreground">VAT</Label>
              <Input
                id={field.name}
                type="number"
                value={field.state.value / 100}
                onblur={field.handleBlur}
                onchange={(e) =>
                  field.handleChange(
                    Math.round((Number.parseFloat(e.currentTarget.value) || 0) * 100)
                  )}
                class="w-32 text-right"
                min={0}
                step={0.01}
              />
            </div>
          {/snippet}
        </form.Field>

        <form.Field name="discountCents">
          {#snippet children(field)}
            <div class="flex items-center justify-between">
              <Label for={field.name} class="text-muted-foreground">Discount</Label>
              <Input
                id={field.name}
                type="number"
                value={field.state.value / 100}
                onblur={field.handleBlur}
                onchange={(e) =>
                  field.handleChange(
                    Math.round((Number.parseFloat(e.currentTarget.value) || 0) * 100)
                  )}
                class="w-32 text-right"
                min={0}
                step={0.01}
              />
            </div>
          {/snippet}
        </form.Field>

        <form.Field name="freightCents">
          {#snippet children(field)}
            <div class="flex items-center justify-between">
              <Label for={field.name} class="text-muted-foreground">Freight</Label>
              <Input
                id={field.name}
                type="number"
                value={field.state.value / 100}
                onblur={field.handleBlur}
                onchange={(e) =>
                  field.handleChange(
                    Math.round((Number.parseFloat(e.currentTarget.value) || 0) * 100)
                  )}
                class="w-32 text-right"
                min={0}
                step={0.01}
              />
            </div>
          {/snippet}
        </form.Field>

        <Separator />

        <form.Field name="vatCents">
          {#snippet children(vatField)}
            <form.Field name="discountCents">
              {#snippet children(discountField)}
                <form.Field name="freightCents">
                  {#snippet children(freightField)}
                    <div class="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span class="text-lg">
                        {formatCents(
                          calculateTotal(
                            subtotalCents,
                            vatField.state.value,
                            discountField.state.value,
                            freightField.state.value
                          )
                        )}
                      </span>
                    </div>
                  {/snippet}
                </form.Field>
              {/snippet}
            </form.Field>
          {/snippet}
        </form.Field>
      </div>

      <form.Field name="notes">
        {#snippet children(field)}
          <div class="space-y-2">
            <Label for={field.name}>Notes</Label>
            <Textarea
              id={field.name}
              value={field.state.value}
              onblur={field.handleBlur}
              onchange={(e) => field.handleChange(e.currentTarget.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        {/snippet}
      </form.Field>
    </Card.Content>
  </Card.Root>

  <!-- Actions -->
  <div class="flex justify-end gap-2">
    {#if onCancel}
      <Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
    {/if}
    <Button type="submit" disabled={updateInvoice.isPending}>
      {#if updateInvoice.isPending}
        <Loader2Icon class="mr-2 size-4 animate-spin" />
        Saving...
      {:else}
        Save Changes
      {/if}
    </Button>
  </div>
</form>
