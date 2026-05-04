<script lang="ts">
  import { CalendarDate, type DateValue } from "@internationalized/date";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import type { CountryCode } from "@repo/config";
  import type { MovementType } from "@repo/perstore-db";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import type { FilterBarDateRange } from "@repo/ui/filter-bar";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createInfiniteQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import DataTable from "$lib/components/tables/DataTable.svelte";
  import MovementTypeCell from "$lib/components/tables/inventory-movements/cells/MovementTypeCell.svelte";
  import QuantityCell from "$lib/components/tables/inventory-movements/cells/QuantityCell.svelte";
  import {
    type MovementItem,
    createColumns,
  } from "$lib/components/tables/inventory-movements/columns";
  import { orpc } from "$lib/orpc_client";
  import { type InventoryMovementsView, inventoryMovementsFilterSchema } from "$lib/search_param";
  import { formatDate, formatPrice } from "$lib/utils";

  interface Props {
    slug: string;
    productId: string;
    country: CountryCode | null;
  }

  let { slug, productId, country }: Props = $props();

  const searchParams = useSearchParams(inventoryMovementsFilterSchema, { noScroll: true });
  const debouncedDateFrom = new Debounced(() => searchParams.dateFrom, 300);
  const debouncedDateTo = new Debounced(() => searchParams.dateTo, 300);
  const movementTypesKey = $derived(JSON.stringify(searchParams.movementTypes ?? []));
  const debouncedMovementTypes = new Debounced(() => movementTypesKey, 300);

  const movementsQuery = createInfiniteQuery(() =>
    orpc.inventory.listMovements.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug,
        productId,
        dateFrom: debouncedDateFrom.current || undefined,
        dateTo: debouncedDateTo.current || undefined,
        movementTypes: JSON.parse(debouncedMovementTypes.current) as MovementType[],
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    })
  );

  const allMovements = $derived(
    (movementsQuery.data?.pages.flatMap((page) => page.items) ?? []) satisfies MovementItem[]
  );

  const columns = $derived(createColumns(country));

  const hasFilters = $derived(
    searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0 ||
      (searchParams.movementTypes?.length ?? 0) > 0
  );

  function resetFilters() {
    searchParams.update({
      search: "",
      movementTypes: [],
      dateFrom: "",
      dateTo: "",
    });
  }

  function parseDate(dateStr: string): DateValue | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  const dateValue = $derived({
    start: parseDate(searchParams.dateFrom),
    end: parseDate(searchParams.dateTo),
  });

  function handleDateRangeChange(value: FilterBarDateRange) {
    searchParams.update({
      dateFrom: value.start ? value.start.toString() : "",
      dateTo: value.end ? value.end.toString() : "",
    });
  }

  const movementTypeOptions: { value: MovementType; label: string }[] = [
    { value: "PURCHASE", label: "Purchase" },
    { value: "SALE", label: "Sale" },
    { value: "RETURN", label: "Return" },
    { value: "WASTAGE", label: "Wastage" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "CORRECTION", label: "Correction" },
  ];
</script>

<section class="space-y-6">
  <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
    <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
      <FilterBar.CheckboxGroup
        items={movementTypeOptions}
        value={searchParams.movementTypes}
        onValueChange={(value) => searchParams.update({ movementTypes: value })}
        placeholder="All Types"
        label="Movement Types"
      />

      <FilterBar.DatePicker value={dateValue} onValueChange={handleDateRangeChange} />

      <FilterBar.Reset />
    </div>

    <ToggleGroup
      type="single"
      value={searchParams.view}
      onValueChange={(value) => {
        if (value && (value === "card" || value === "table")) {
          searchParams.update({ view: value as InventoryMovementsView });
        }
      }}
      variant="outline"
      size="sm"
      class="shrink-0"
    >
      <ToggleGroupItem value="card" aria-label="Card view">
        <LayoutGridIcon class="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <ListIcon class="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  </FilterBar.Root>

  {#if movementsQuery.isLoading}
    <div class="flex items-center justify-center py-12">
      <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
    </div>
  {:else if movementsQuery.isError}
    <div class="flex items-center justify-center py-12">
      <p class="text-red-500">Failed to load inventory movements</p>
    </div>
  {:else if allMovements.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <ArrowLeftRightIcon class="text-muted-foreground size-8" />
      </div>
      <h3 class="text-lg font-semibold">No movements found</h3>
      <p class="text-muted-foreground max-w-sm text-sm">
        {hasFilters
          ? "Try adjusting your filters"
          : "Inventory movements will appear here when stock changes occur"}
      </p>
    </div>
  {:else if searchParams.view === "table"}
    <DataTable {columns} data={allMovements} loading={false} />

    {#if movementsQuery.hasNextPage}
      <div class="mt-4 flex justify-center">
        <Button
          variant="outline"
          onclick={() => movementsQuery.fetchNextPage()}
          disabled={movementsQuery.isFetchingNextPage}
        >
          {#if movementsQuery.isFetchingNextPage}
            <Loader2Icon class="mr-2 size-4 animate-spin" />
            Loading...
          {:else}
            Load More
          {/if}
        </Button>
      </div>
    {/if}
  {:else}
    <div class="space-y-2">
      {#each allMovements as movement (movement.id)}
        <Card.Root class="overflow-hidden p-0">
          <Card.Content class="p-0">
            <div class="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5">
              <div
                class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg"
              >
                <PackageIcon class="text-primary size-5" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                  <MovementTypeCell movementType={movement.movementType} />
                  <span>•</span>
                  <span>{formatDate(movement.occurredAt, true)}</span>
                </div>
                {#if movement.reason}
                  <p class="text-muted-foreground mt-0.5 truncate text-xs">{movement.reason}</p>
                {/if}
              </div>

              <div class="shrink-0 text-right">
                <QuantityCell qty={movement.qty} />
                {#if movement.movementType === "SALE" || movement.movementType === "RETURN"}
                  {#if movement.unitPriceCents !== null}
                    <p class="text-muted-foreground text-xs">
                      {formatPrice(movement.unitPriceCents, country)}
                    </p>
                  {/if}
                {:else if movement.unitCostCents !== null}
                  <p class="text-muted-foreground text-xs">
                    {formatPrice(movement.unitCostCents, country)}
                  </p>
                {/if}
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    {#if movementsQuery.hasNextPage}
      <div class="mt-4 flex justify-center">
        <Button
          variant="outline"
          onclick={() => movementsQuery.fetchNextPage()}
          disabled={movementsQuery.isFetchingNextPage}
        >
          {#if movementsQuery.isFetchingNextPage}
            <Loader2Icon class="mr-2 size-4 animate-spin" />
            Loading...
          {:else}
            Load More
          {/if}
        </Button>
      </div>
    {/if}
  {/if}
</section>
