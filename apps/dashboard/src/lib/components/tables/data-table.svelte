<script lang="ts" generics="TData, TValue">
  import type { ColumnDef } from "@tanstack/table-core";
  import { getCoreRowModel } from "@tanstack/table-core";
  import { createSvelteTable } from "@repo/ui/data-table";
  import { FlexRender } from "@repo/ui/data-table";
  import * as Table from "@repo/ui/table";
  import { ScrollArea, Scrollbar } from "@repo/ui/scroll-area";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";

  type Props = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    loading?: boolean;
    onRowClick?: (row: TData) => void;
  };

  const { columns, data, loading = false, onRowClick }: Props = $props();

  const table = $derived(
    createSvelteTable({
      get data() {
        return data;
      },
      columns,
      getCoreRowModel: getCoreRowModel(),
    })
  );
</script>

<div class="overflow-hidden rounded-lg border">
  <ScrollArea>
    <Table.Root>
      <Table.Header class="bg-muted sticky top-0 z-10">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              <Loader2Icon class="text-muted-foreground mx-auto size-6 animate-spin" />
            </Table.Cell>
          </Table.Row>
        {:else if table.getRowModel().rows?.length}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row
              data-state={row.getIsSelected() && "selected"}
              class={onRowClick ? "cursor-pointer" : ""}
              onclick={() => onRowClick?.(row.original)}
            >
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell>
                  <FlexRender
                    content={cell.column.columnDef.cell}
                    context={cell.getContext()}
                  />
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              No results.
            </Table.Cell>
          </Table.Row>
        {/if}
      </Table.Body>
    </Table.Root>
    <Scrollbar orientation="horizontal" />
  </ScrollArea>
</div>
