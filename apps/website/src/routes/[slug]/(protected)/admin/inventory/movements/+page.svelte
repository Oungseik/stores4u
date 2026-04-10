<script lang="ts">
  import { CalendarDate, type DateValue } from "@internationalized/date";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import PackageIcon from "@lucide/svelte/icons/package";
  import type { MovementType, ReferenceType } from "@repo/db";
  import { Button } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import type { FilterBarDateRange } from "@repo/ui/filter-bar";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createInfiniteQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import MovementTypeCell from "$lib/components/tables/inventory-movements/cells/MovementTypeCell.svelte";
  import QuantityCell from "$lib/components/tables/inventory-movements/cells/QuantityCell.svelte";
  import {
    type MovementItem,
    createColumns,
  } from "$lib/components/tables/inventory-movements/columns";
  import { orpc } from "$lib/orpc_client";
  import { type InventoryMovementsView, inventoryMovementsFilterSchema } from "$lib/search_param";
  import { formatDate } from "$lib/utils";

  import type { PageProps } from "./$types";

  const { params, data: shop }: PageProps = $props();

  const searchParams = useSearchParams(inventoryMovementsFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedDateFrom = new Debounced(() => searchParams.dateFrom, 300);
  const debouncedDateTo = new Debounced(() => searchParams.dateTo, 300);
  const movementTypesKey = $derived(JSON.stringify(searchParams.movementTypes ?? []));
  const referenceTypesKey = $derived(JSON.stringify(searchParams.referenceTypes ?? []));
  const debouncedMovementTypes = new Debounced(() => movementTypesKey, 300);
  const debouncedReferenceTypes = new Debounced(() => referenceTypesKey, 300);

  const movements = createInfiniteQuery(() =>
    orpc.inventory.listMovements.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        slug: params.slug,
        search: debouncedSearch.current || undefined,
        dateFrom: debouncedDateFrom.current || undefined,
        dateTo: debouncedDateTo.current || undefined,
        movementTypes: JSON.parse(debouncedMovementTypes.current) as MovementType[],
        referenceTypes: JSON.parse(debouncedReferenceTypes.current) as ReferenceType[],
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allMovements = $derived(
    (movements.data?.pages.flatMap((page) => page.items) ?? []) satisfies MovementItem[]
  );

  const columns = $derived(createColumns(shop.country));

  const hasFilters = $derived(
    searchParams.search.length > 0 ||
      searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0 ||
      searchParams.movementTypes?.length > 0 ||
      searchParams.referenceTypes?.length > 0
  );

  function resetFilters() {
    searchParams.update({
      search: "",
      movementTypes: [],
      dateFrom: "",
      dateTo: "",
      referenceTypes: [],
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

  const referenceTypeOptions: { value: ReferenceType; label: string }[] = [
    { value: "ORDER", label: "Order" },
    { value: "PURCHASE_INVOICE", label: "Purchase Invoice" },
    { value: "MANUAL", label: "Manual" },
  ];
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Inventory" },
      { label: "Movements" },
    ]}
  />

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder="Search products, SKU, reference ID..."
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />

        <FilterBar.CheckboxGroup
          items={movementTypeOptions}
          value={searchParams.movementTypes}
          onValueChange={(value) => searchParams.update({ movementTypes: value })}
          placeholder="All Types"
          label="Movement Types"
        />

        <FilterBar.DatePicker value={dateValue} onValueChange={handleDateRangeChange} />

        <FilterBar.CheckboxGroup
          items={referenceTypeOptions}
          value={searchParams.referenceTypes}
          onValueChange={(value) => searchParams.update({ referenceTypes: value })}
          placeholder="All References"
          label="Reference Type"
        />

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
      >
        <ToggleGroupItem value="card" aria-label="Card view">
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <ListIcon class="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </FilterBar.Root>

    {#if movements.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if movements.isError}
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

      {#if movements.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => movements.fetchNextPage()}
            disabled={movements.isFetchingNextPage}
          >
            {#if movements.isFetchingNextPage}
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
                  <p class="truncate text-sm font-medium">{movement.productName}</p>
                  <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                    {#if movement.productSku}
                      <span>{movement.productSku}</span>
                      <span>•</span>
                    {/if}
                    <MovementTypeCell movementType={movement.movementType} />
                    <span>•</span>
                    <span>{formatDate(movement.occurredAt, true)}</span>
                  </div>
                </div>

                <div class="shrink-0 text-right">
                  <QuantityCell qty={movement.qty} />
                  {#if movement.movementType === "SALE" || movement.movementType === "RETURN"}
                    {#if movement.unitPriceCents !== null}
                      <p class="text-muted-foreground text-xs">
                        <Pricing cents={movement.unitPriceCents} country={shop.country} />
                      </p>
                    {/if}
                  {:else if movement.unitCostCents !== null}
                    <p class="text-muted-foreground text-xs">
                      <Pricing cents={movement.unitCostCents} country={shop.country} />
                    </p>
                  {/if}
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>

      {#if movements.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => movements.fetchNextPage()}
            disabled={movements.isFetchingNextPage}
          >
            {#if movements.isFetchingNextPage}
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
</div>
