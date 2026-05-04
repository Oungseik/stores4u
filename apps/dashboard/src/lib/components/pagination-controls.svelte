<script lang="ts">
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ChevronsLeftIcon from "@lucide/svelte/icons/chevrons-left";
  import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";
  import { Button } from "@repo/ui/button";
  import * as Select from "@repo/ui/select";
  import { Label } from "@repo/ui/label";

  type Props = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    loading?: boolean;
  };

  const { page, pageSize, total, totalPages, onPageChange, onPageSizeChange, loading = false }: Props = $props();
</script>

<div class="flex items-center justify-between px-2">
  <div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
    {total} product{total === 1 ? "" : "s"} total
  </div>
  <div class="flex w-full items-center gap-8 lg:w-fit">
    <div class="hidden items-center gap-2 lg:flex">
      <Label for="rows-per-page" class="text-sm font-medium">Rows per page</Label>
      <Select.Root
        type="single"
        value={String(pageSize)}
        onValueChange={(v) => onPageSizeChange(Number(v))}
      >
        <Select.Trigger size="sm" class="w-20" id="rows-per-page">
          {pageSize}
        </Select.Trigger>
        <Select.Content side="top">
          {#each [10, 20, 50, 100] as size (size)}
            <Select.Item value={String(size)}>
              {size}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex w-fit items-center justify-center text-sm font-medium">
      Page {page} of {totalPages || 1}
    </div>
    <div class="ms-auto flex items-center gap-2 lg:ms-0">
      <Button
        variant="outline"
        class="hidden size-8 lg:flex"
        size="icon"
        onclick={() => onPageChange(1)}
        disabled={page <= 1 || loading}
      >
        <span class="sr-only">Go to first page</span>
        <ChevronsLeftIcon />
      </Button>
      <Button
        variant="outline"
        class="size-8"
        size="icon"
        onclick={() => onPageChange(page - 1)}
        disabled={page <= 1 || loading}
      >
        <span class="sr-only">Go to previous page</span>
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        class="size-8"
        size="icon"
        onclick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || loading}
      >
        <span class="sr-only">Go to next page</span>
        <ChevronRightIcon />
      </Button>
      <Button
        variant="outline"
        class="hidden size-8 lg:flex"
        size="icon"
        onclick={() => onPageChange(totalPages)}
        disabled={page >= totalPages || loading}
      >
        <span class="sr-only">Go to last page</span>
        <ChevronsRightIcon />
      </Button>
    </div>
  </div>
</div>
