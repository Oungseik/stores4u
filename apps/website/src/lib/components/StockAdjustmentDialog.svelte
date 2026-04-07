<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "@repo/ui/button";
  import * as Dialog from "@repo/ui/dialog";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { NumberInput } from "@repo/ui/number-input";
  import * as Select from "@repo/ui/select";
  import { Textarea } from "@repo/ui/textarea";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
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
  let movementType = $state<MovementType>("ADJUSTMENT");
  let qty = $state<number>(1);
  let unitCost = $state<number>(0);
  let date = $state(getTodayString());
  let reason = $state("");
  let isSubmitting = $state(false);

  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  const projectedStock = $derived(
    direction === "ADD" ? currentStock + qty : currentStock - qty
  );

  const canSubmit = $derived(
    qty > 0 && unitCost > 0 && date.length > 0 && (direction !== "SUBTRACT" || currentStock >= qty)
  );

  const adjustMutation = createMutation(() => orpc.inventory.adjustStock.mutationOptions());

  function resetForm() {
    direction = "ADD";
    movementType = "ADJUSTMENT";
    qty = 1;
    unitCost = 0;
    date = getTodayString();
    reason = "";
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return;

    isSubmitting = true;

    try {
      await adjustMutation.mutateAsync({
        slug,
        productId,
        direction,
        movementType,
        qty,
        unitCostCents: Math.round(unitCost * 100),
        date,
        reason: reason.trim() || undefined,
      });

      toast.success("Stock adjusted successfully");
      queryClient.invalidateQueries({ queryKey: orpc.products.get.key() });
      queryClient.invalidateQueries({ queryKey: orpc.inventory.listMovements.key() });
      queryClient.invalidateQueries({ queryKey: orpc.products.list.key() });
      resetForm();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to adjust stock");
    } finally {
      isSubmitting = false;
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      resetForm();
      onClose();
    }
  }

  const movementTypeOptions: { value: MovementType; label: string }[] = [
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "CORRECTION", label: "Correction" },
    { value: "WASTAGE", label: "Wastage" },
    { value: "RETURN", label: "Return" },
  ];
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Adjust Stock</Dialog.Title>
      <Dialog.Description>
        Adjust stock for {productName}. Current stock: {currentStock}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label>Direction</Label>
        <ToggleGroup
          type="single"
          value={direction}
          onValueChange={(value) => {
            if (value === "ADD" || value === "SUBTRACT") {
              direction = value;
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

      <div class="space-y-2">
        <Label>Type</Label>
        <Select.Root
          type="single"
          value={movementType}
          onValueChange={(value) => {
            if (value === "ADJUSTMENT" || value === "CORRECTION" || value === "WASTAGE" || value === "RETURN") {
              movementType = value;
            }
          }}
        >
          <Select.Trigger class="w-full">
            {movementTypeOptions.find((o) => o.value === movementType)?.label ?? "Select type"}
          </Select.Trigger>
          <Select.Content>
            {#each movementTypeOptions as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label>Quantity</Label>
        <NumberInput bind:value={qty} class="w-full" min={1} fraction={0} />
      </div>

      <div class="space-y-2">
        <Label>Unit Cost</Label>
        <NumberInput bind:value={unitCost} class="w-full" min={0} fraction={2} />
      </div>

      <div class="space-y-2">
        <Label>Date</Label>
        <Input type="date" bind:value={date} />
      </div>

      <div class="space-y-2">
        <Label>Reason (optional)</Label>
        <Textarea bind:value={reason} placeholder="Why is this adjustment being made?" rows={2} />
      </div>

      <div class="text-muted-foreground rounded-lg border p-3 text-sm">
        <div class="flex items-center justify-between">
          <span>Current stock</span>
          <span class="font-medium">{currentStock}</span>
        </div>
        <div class="flex items-center justify-between">
          <span>{direction === "ADD" ? "Adding" : "Subtracting"}</span>
          <span class={direction === "ADD" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {direction === "ADD" ? "+" : "-"}{qty}
          </span>
        </div>
        <div class="flex items-center justify-between border-t pt-2">
          <span class="font-medium">Projected stock</span>
          <span
            class={projectedStock < 0
              ? "text-destructive font-semibold"
              : "font-semibold"}
          >
            {projectedStock}
          </span>
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={!canSubmit || isSubmitting}>
        {#if isSubmitting}
          <Loader2Icon class="size-4 animate-spin" />
          Adjusting...
        {:else}
          Confirm Adjustment
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
