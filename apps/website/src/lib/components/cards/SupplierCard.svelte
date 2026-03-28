<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import UserIcon from "@lucide/svelte/icons/user";
  import { buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import { Label } from "@repo/ui/label";
  import * as Popover from "@repo/ui/popover";
  import { Switch } from "@repo/ui/switch";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import SupplierForm from "$lib/components/forms/SupplierForm.svelte";
  import { orpc } from "$lib/orpc_client";

  export type Supplier = {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  };

  interface Props {
    slug: string;
    suppliers: Supplier[];
    selectedSupplier?: Supplier | null;
    isExistingSupplier?: boolean;
    initialSupplierData?: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      paymentTerms?: string;
    };
  }

  let {
    slug,
    suppliers,
    selectedSupplier = $bindable(null),
    isExistingSupplier = $bindable(false),
    initialSupplierData,
  }: Props = $props();

  const queryClient = useQueryClient();

  let supplierOpen = $state(false);
  let supplierFormRef = $state<{ resetForm: () => void } | undefined>(undefined);

  const createSupplierMutation = createMutation(() =>
    orpc.suppliers.create.mutationOptions({
      onSuccess: (created) => {
        const newSupplier: Supplier = {
          id: created.id,
          name: created.name,
          contactName: created.contactName ?? null,
          phone: created.phone ?? null,
          email: created.email ?? null,
          address: created.address ?? null,
        };
        selectedSupplier = newSupplier;
        isExistingSupplier = true;
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.list.key() });
        toast.success("Supplier created successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create supplier");
      },
    })
  );

  function selectSupplier(supplier: Supplier) {
    selectedSupplier = supplier;
    supplierOpen = false;
  }

  function handleFormSuccess() {
    createSupplierMutation.reset();
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Building2Icon class="size-4" />
      Supplier Information
    </Card.Title>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div class="flex items-center gap-4">
      <Switch
        id="existing-supplier"
        checked={isExistingSupplier}
        onCheckedChange={(v) => (isExistingSupplier = v)}
      />
      <Label for="existing-supplier">
        {isExistingSupplier ? "Existing Supplier" : "Create New Supplier"}
      </Label>
    </div>

    {#if isExistingSupplier}
      <Popover.Root bind:open={supplierOpen}>
        <Popover.Trigger
          class={buttonVariants({ variant: "outline", class: "w-full justify-between" })}
        >
          <span class="truncate">{selectedSupplier?.name || "Select supplier..."}</span>
          <ChevronDownIcon class="size-4 opacity-50" />
        </Popover.Trigger>
        <Popover.Content class="w-80 p-0" align="start">
          <Command.Root>
            <Command.Input placeholder="Search suppliers..." />
            <Command.List>
              <Command.Empty>No suppliers found.</Command.Empty>
              {#each suppliers as supplier}
                <Command.Item value={supplier.name} onSelect={() => selectSupplier(supplier)}>
                  <CheckIcon
                    class={["size-4", selectedSupplier?.id !== supplier.id && "text-transparent"]}
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

      {#if selectedSupplier}
        <div class="bg-background rounded-lg border p-4 shadow-sm">
          <div class="mb-3 flex items-start gap-3">
            <div
              class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <Building2Icon class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{selectedSupplier.name}</p>
              <p class="text-muted-foreground text-xs">{selectedSupplier.id}</p>
            </div>
          </div>

          <div class="space-y-2">
            {#if selectedSupplier.contactName}
              <div class="flex items-center gap-2 text-sm">
                <div
                  class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                >
                  <UserIcon class="size-3.5" />
                </div>
                <span class="truncate">{selectedSupplier.contactName}</span>
              </div>
            {/if}

            {#if selectedSupplier.phone}
              <div class="flex items-center gap-2 text-sm">
                <div
                  class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                >
                  <PhoneIcon class="size-3.5" />
                </div>
                <span class="truncate">{selectedSupplier.phone}</span>
              </div>
            {/if}

            {#if selectedSupplier.email}
              <div class="flex items-center gap-2 text-sm">
                <div
                  class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                >
                  <MailIcon class="size-3.5" />
                </div>
                <span class="text-primary truncate">{selectedSupplier.email}</span>
              </div>
            {/if}

            {#if selectedSupplier.address}
              <div class="flex items-center gap-2 text-sm">
                <div
                  class="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded"
                >
                  <MapPinIcon class="size-3.5" />
                </div>
                <span class="text-muted-foreground text-sm leading-relaxed"
                  >{selectedSupplier.address}</span
                >
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {:else}
      <SupplierForm
        bind:this={supplierFormRef}
        {slug}
        initialData={initialSupplierData
          ? {
              action: "create",
              name: initialSupplierData.name,
              contactName: initialSupplierData.contactName,
              phone: initialSupplierData.phone,
              email: initialSupplierData.email,
              address: initialSupplierData.address,
              paymentTerms: initialSupplierData.paymentTerms,
            }
          : undefined}
        onSuccess={handleFormSuccess}
      />
    {/if}
  </Card.Content>
</Card.Root>
