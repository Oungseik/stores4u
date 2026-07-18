<script lang="ts">
  import * as msg from "$lib/paraglide/messages";
  import { parseDate } from "@internationalized/date";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import type { MovementType } from "$lib/server/db";
  import { Button } from "@repo/ui/button";
  import type { FilterBarDateRange } from "@repo/ui/filter-bar";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createInfiniteQuery } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import {
    type MovementItem,
    createColumns,
  } from "$lib/components/tables/inventory-movements/columns";
  import MovementCardItem from "$lib/components/tables/inventory-movements/MovementCardItem.svelte";
  import { orpc } from "$lib/orpc_client";
  import { type InventoryMovementsView, inventoryMovementsFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const searchParams = useSearchParams(inventoryMovementsFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedDateFrom = new Debounced(() => searchParams.dateFrom, 300);
  const debouncedDateTo = new Debounced(() => searchParams.dateTo, 300);
  const movementTypesKey = $derived(JSON.stringify(searchParams.movementTypes ?? []));
  const debouncedMovementTypes = new Debounced(() => movementTypesKey, 300);

  const movements = createInfiniteQuery(() =>
    orpc.inventory.listMovements.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        cursor,
        search: debouncedSearch.current || undefined,
        dateFrom: debouncedDateFrom.current || undefined,
        dateTo: debouncedDateTo.current || undefined,
        movementTypes: JSON.parse(debouncedMovementTypes.current) as MovementType[],
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allMovements = $derived(
    (movements.data?.pages.flatMap((page) => page.items) ?? []) satisfies MovementItem[],
  );

  const columns = $derived(createColumns(shop.currency));

  const hasFilters = $derived(
    searchParams.search.length > 0 ||
      searchParams.dateFrom.length > 0 ||
      searchParams.dateTo.length > 0 ||
      searchParams.movementTypes?.length > 0,
  );

  function resetFilters() {
    searchParams.update({
      search: "",
      movementTypes: [],
      dateFrom: "",
      dateTo: "",
    });
  }

  const dateValue = $derived({
    start: searchParams.dateFrom ? parseDate(searchParams.dateFrom) : null,
    end: searchParams.dateTo ? parseDate(searchParams.dateTo) : null,
  });

  function handleDateRangeChange(value: FilterBarDateRange) {
    searchParams.update({
      dateFrom: value.start ? value.start.toString() : "",
      dateTo: value.end ? value.end.toString() : "",
    });
  }

  const movementTypeOptions: { value: MovementType; label: string }[] = [
    { value: "PURCHASE", label: msg.ui_purchase() },
    { value: "SALE", label: msg.ui_sale() },
    { value: "RETURN", label: msg.ui_return() },
    { value: "WASTAGE", label: msg.ui_wastage() },
    { value: "ADJUSTMENT", label: msg.ui_adjustment() },
    { value: "CORRECTION", label: msg.ui_correction() },
  ];
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_inventory() },
      { label: msg.ui_movements() },
    ]}
  />

  <div class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">{msg.ui_inventory_movements()}</h1>
    <p class="text-muted-foreground text-sm">
      {msg.ui_track_stock_changes_transfers_and_adjustments_across_yo()}
    </p>
  </div>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder={msg.ui_search_products_sku_reference_id()}
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />

        <FilterBar.CheckboxGroup
          items={movementTypeOptions}
          value={searchParams.movementTypes}
          onValueChange={(value) => searchParams.update({ movementTypes: value })}
          placeholder={msg.ui_all_types()}
          label={msg.ui_movement_types()}
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
        <ToggleGroupItem value="card" aria-label={msg.ui_card_view()}>
          <LayoutGridIcon class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label={msg.ui_table_view()}>
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
        <p class="text-red-500">{msg.ui_failed_to_load_inventory_movements()}</p>
      </div>
    {:else if allMovements.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <ArrowLeftRightIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_movements_found()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? msg.ui_try_clearing_filters()
            : msg.ui_inventory_movements_will_appear_here_when_stock_changes()}
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
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
            {/if}
          </Button>
        </div>
      {/if}
    {:else}
      <div class="space-y-2">
        {#each allMovements as movement (movement.id)}
          <MovementCardItem {movement} currency={shop.currency} />
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
              {msg.ui_loading_b04ba49()}
            {:else}
              {msg.ui_load_more()}
            {/if}
          </Button>
        </div>
      {/if}
    {/if}
  </section>
</div>
