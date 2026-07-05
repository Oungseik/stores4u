<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MapPinIcon from "@lucide/svelte/icons/map-pin";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import UserIcon from "@lucide/svelte/icons/user";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Command from "@repo/ui/command";
  import { Label } from "@repo/ui/label";
  import * as Popover from "@repo/ui/popover";
  import { Switch } from "@repo/ui/switch";
  import SupplierForm, { type CreatedSupplier } from "$lib/components/forms/SupplierForm.svelte";

  export type Supplier = CreatedSupplier;

  interface Props {
    suppliers: Supplier[];
    selectedSupplier?: Supplier | null;
    isExistingSupplier?: boolean;
    initialSupplierData?: {
      name?: string;
      contactName?: string;
      phone?: string;
      phone2?: string;
      email?: string;
      address?: string;
      paymentTerms?: string;
    };
  }

  let {
    suppliers,
    selectedSupplier = $bindable(null),
    isExistingSupplier = $bindable(false),
    initialSupplierData,
  }: Props = $props();

  let supplierOpen = $state(false);
  let isEditing = $state(false);

  function selectSupplier(supplier: Supplier) {
    selectedSupplier = supplier;
    supplierOpen = false;
  }

  function handleFormSuccess(supplier: Supplier) {
    selectedSupplier = supplier;
    isExistingSupplier = true;
    isEditing = false;
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
        onCheckedChange={(v) => {
          isExistingSupplier = v;
          if (!v) isEditing = false;
        }}
      />
      <Label for="existing-supplier">
        {isExistingSupplier ? "Existing Supplier" : "Create New Supplier"}
      </Label>
    </div>

    {#if isExistingSupplier}
      {#if isEditing && selectedSupplier}
        <SupplierForm
          initialData={{
            action: "update",
            id: selectedSupplier.id,
            name: selectedSupplier.name,
            contactName: selectedSupplier.contactName,
            phone: selectedSupplier.phone,
            phone2: selectedSupplier.phone2,
            email: selectedSupplier.email,
            address: selectedSupplier.address,
            paymentTerms: selectedSupplier.paymentTerms,
          }}
          onSuccess={handleFormSuccess}
          onCancel={() => (isEditing = false)}
        />
      {:else}
        <Popover.Root bind:open={supplierOpen}>
          <Popover.Trigger
            class={buttonVariants({ variant: "outline", class: "w-full justify-between" })}
          >
            <span class="truncate">{selectedSupplier?.name || "Select supplier..."}</span>
            <ChevronDownIcon class="size-4 opacity-50" />
          </Popover.Trigger>
          <Popover.Content class="w-80" align="start">
            <Command.Root class="gap-2" value={selectedSupplier?.name}>
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
            <div class="mb-3 flex items-center gap-3">
              <div
                class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
              >
                <Building2Icon class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{selectedSupplier.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 shrink-0"
                title="Edit supplier"
                onclick={() => (isEditing = true)}
              >
                <PencilIcon class="size-4" />
              </Button>
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

              {#if selectedSupplier.phone2}
                <div class="flex items-center gap-2 text-sm">
                  <div
                    class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                  >
                    <PhoneIcon class="size-3.5" />
                  </div>
                  <span class="truncate">{selectedSupplier.phone2}</span>
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
      {/if}
    {:else}
      <SupplierForm
        initialData={initialSupplierData
          ? {
              action: "create",
              name: initialSupplierData.name,
              contactName: initialSupplierData.contactName,
              phone: initialSupplierData.phone,
              phone2: initialSupplierData.phone2,
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
