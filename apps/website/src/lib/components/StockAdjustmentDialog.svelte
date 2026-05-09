<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import { ScrollArea } from "@repo/ui/scroll-area";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import * as Select from "@repo/ui/select";
  import { Textarea } from "@repo/ui/textarea";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createForm } from "@tanstack/svelte-form";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";

  import { orpc } from "$lib/orpc_client";

  type Direction = "ADD" | "SUBTRACT";
  type MovementType = "ADJUSTMENT" | "CORRECTION" | "WASTAGE" | "RETURN";

  interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    productId: string;
    productName: string;
    currentStock: number;
  }

  let { open, onClose, slug, productId, productName, currentStock }: Props = $props();

  const queryClient = useQueryClient();

  let direction = $state<Direction>("ADD");
  let qty = $state(1);

  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  const movementTypeOptions: { value: MovementType; label: string }[] = [
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "CORRECTION", label: "Correction" },
    { value: "WASTAGE", label: "Wastage" },
    { value: "RETURN", label: "Return" },
  ];

  const adjustMutation = createMutation(() =>
    orpc.inventory.adjustStock.mutationOptions({
      onSuccess: () => {
        toast.success("Stock adjusted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.products.get.key() });
        queryClient.invalidateQueries({ queryKey: orpc.inventory.listMovements.key() });
        queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
        form.reset();
        form.setFieldValue("date", getTodayString());
        onClose();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to adjust stock");
      },
    })
  );

  const form = createForm(() => ({
    defaultValues: {
      direction: "ADD" as Direction,
      movementType: "ADJUSTMENT" as MovementType,
      qty: 1,
      unitCost: 0,
      date: getTodayString(),
      reason: "",
    },
    onSubmit: async ({ value }) => {
      adjustMutation.mutate({
        slug,
        productId,
        direction: value.direction,
        movementType: value.movementType,
        qty: value.qty,
        unitCostCents: Math.round(value.unitCost * 100),
        date: value.date,
        reason: value.reason.trim() || undefined,
      });
    },
  }));

  const projectedStock = $derived(direction === "ADD" ? currentStock + qty : currentStock - qty);

  function handleOpenChange(value: boolean) {
    if (!value) {
      form.reset();
      form.setFieldValue("date", getTodayString());
      direction = "ADD";
      qty = 1;
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="px-0 sm:max-w-xl">
    <Dialog.Header class="px-3 sm:px-4">
      <Dialog.Title>Adjust Stock</Dialog.Title>
      <Dialog.Description>
        Adjust stock for {productName}. Current stock: {currentStock}
      </Dialog.Description>
    </Dialog.Header>

    <ScrollArea class="max-h-[72vh] px-3 sm:px-4">
      <form
        class="space-y-4 px-1 py-4"
        onsubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="direction">
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Direction</Label>
              <ToggleGroup
                type="single"
                value={field.state.value}
                onValueChange={(value) => {
                  if (value === "ADD" || value === "SUBTRACT") {
                    direction = value;
                    field.handleChange(value);
                  }
                }}
                variant="outline"
                class="w-full"
              >
                <ToggleGroupItem value="ADD" class="flex-1">
                  <PlusIcon class="size-4" />
                  Add
                </ToggleGroupItem>
                <ToggleGroupItem value="SUBTRACT" class="flex-1">
                  <MinusIcon class="size-4" />
                  Subtract
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          {/snippet}
        </form.Field>

        <form.Field name="movementType">
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Type</Label>
              <Select.Root
                type="single"
                value={field.state.value}
                onValueChange={(value) => {
                  if (
                    value === "ADJUSTMENT" ||
                    value === "CORRECTION" ||
                    value === "WASTAGE" ||
                    value === "RETURN"
                  ) {
                    field.handleChange(value);
                  }
                }}
              >
                <Select.Trigger class="w-full">
                  {movementTypeOptions.find((o) => o.value === field.state.value)?.label ??
                    "Select type"}
                </Select.Trigger>
                <Select.Content>
                  {#each movementTypeOptions as option}
                    <Select.Item value={option.value}>{option.label}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          {/snippet}
        </form.Field>

        <form.Field
          name="qty"
          validators={{
            onChange: ({ value }) => {
              if (!value || value <= 0) return "Quantity must be greater than 0";
              return undefined;
            },
          }}
        >
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Quantity</Label>
              <NumberInput
                value={field.state.value}
                onValueChange={(v) => {
                  qty = v;
                  field.handleChange(v);
                }}
                class="w-full"
                min={1}
                fraction={0}
              />
              {#if field.state.meta.errors.length}
                <p class="text-sm text-red-500">{field.state.meta.errors}</p>
              {/if}
            </div>
          {/snippet}
        </form.Field>

        <form.Field
          name="unitCost"
          validators={{
            onChange: ({ value }) => {
              if (!value || value <= 0) return "Unit cost must be greater than 0";
              return undefined;
            },
          }}
        >
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Unit Cost</Label>
              <NumberInput
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                class="w-full"
                min={0}
                fraction={2}
              />
              {#if field.state.meta.errors.length}
                <p class="text-sm text-red-500">{field.state.meta.errors}</p>
              {/if}
            </div>
          {/snippet}
        </form.Field>

        <form.Field
          name="date"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.length === 0) return "Date is required";
              return undefined;
            },
          }}
        >
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Date</Label>
              <Input
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

        <form.Field name="reason">
          {#snippet children(field)}
            <div class="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={field.state.value}
                onchange={(e) => field.handleChange(e.currentTarget.value)}
                placeholder="Why is this adjustment being made?"
                rows={2}
              />
            </div>
          {/snippet}
        </form.Field>

        <div class="text-muted-foreground rounded-lg border p-3 text-sm">
          <div class="flex items-center justify-between">
            <span>Current stock</span>
            <span class="font-medium">{currentStock}</span>
          </div>
          <div class="flex items-center justify-between pb-2">
            <span>{direction === "ADD" ? "Adding" : "Subtracting"}</span>
            <span
              class={direction === "ADD"
                ? "font-medium text-green-600"
                : "font-medium text-red-600"}
            >
              {direction === "ADD" ? "+" : "-"}{qty}
            </span>
          </div>
          <div class="flex items-center justify-between border-t pt-2">
            <span class="font-medium">Projected stock</span>
            <span class={projectedStock < 0 ? "text-destructive font-semibold" : "font-semibold"}>
              {projectedStock}
            </span>
          </div>
        </div>
      </form>
    </ScrollArea>

    <Dialog.Footer class="mx-0">
      <Button
        variant="outline"
        onclick={() => handleOpenChange(false)}
        disabled={adjustMutation.isPending}
      >
        Cancel
      </Button>
      <Button onclick={() => form.handleSubmit()} disabled={adjustMutation.isPending}>
        {#if adjustMutation.isPending}
          <Loader2Icon class="size-4 animate-spin" />
          Adjusting...
        {:else}
          Confirm Adjustment
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
