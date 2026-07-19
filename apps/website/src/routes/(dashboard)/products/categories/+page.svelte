<script lang="ts">
  import { localizeError } from "$lib/error-message";
  import * as msg from "$lib/paraglide/messages";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import ListPlusIcon from "@lucide/svelte/icons/list-plus";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import { confirmDelete } from "@repo/ui/confirm-delete-dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import AddCategoryDialog from "$lib/components/dialogs/AddCategoryDialog.svelte";
  import EditCategoryDialog from "$lib/components/dialogs/EditCategoryDialog.svelte";
  import ManageCategoryProductsDialog from "$lib/components/dialogs/ManageCategoryProductsDialog.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import type { CategoryItem } from "$lib/components/tables/categories/columns";
  import { orpc } from "$lib/orpc_client";

  const categoriesFilterSchema = z.object({
    search: z.string().default(""),
  });

  const searchParams = useSearchParams(categoriesFilterSchema, { noScroll: true });
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const categories = createInfiniteQuery(() =>
    orpc.categories.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: true,
    }),
  );

  const allCategories = $derived(
    (categories.data?.pages.flatMap((page) => page.items) ?? []).filter((c) =>
      debouncedSearch.current
        ? c.name.toLowerCase().includes(debouncedSearch.current.toLowerCase())
        : true,
    ),
  );

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  let isAddOpen = $state(false);
  let editingCategory = $state<CategoryItem | null>(null);
  let managingCategory = $state<CategoryItem | null>(null);

  function handleEditCategory(category: CategoryItem) {
    editingCategory = category;
  }

  function handleManageProducts(category: CategoryItem) {
    managingCategory = category;
  }

  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.categories.delete.mutationOptions({
      onSuccess: () => {
        toast.success(msg.ui_category_deleted_successfully());
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
      },
      onError: (error) => {
        toast.error(localizeError(error, "ui_failed_to_delete_category"));
      },
    }),
  );

  function performDelete(category: CategoryItem) {
    deleteMutation.mutate({ id: category.id });
  }

  function handleDeleteCategory(category: CategoryItem) {
    confirmDelete({
      title: msg.ui_delete_category(),
      description: msg.confirm_delete_named({ name: category.name }),
      onConfirm: async () => {
        performDelete(category);
      },
    });
  }
</script>

<div class="flex flex-col gap-6 p-4 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: msg.ui_dashboard(), href: `/` },
      { label: msg.ui_products(), href: `/products` },
      { label: msg.ui_categories() },
    ]}
  >
    {#snippet actions()}
      <Button onclick={() => (isAddOpen = true)}>
        <PlusIcon class="size-4" />
        {msg.ui_add_category()}
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <section class="@container/main space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters}>
      <div class="flex flex-1 flex-wrap items-center justify-start gap-2 md:gap-4">
        <FilterBar.Search
          placeholder={msg.ui_search_categories()}
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
        <FilterBar.Reset />
      </div>
    </FilterBar.Root>

    {#if categories.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if categories.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">{msg.ui_failed_to_load_categories()}</p>
      </div>
    {:else if allCategories.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <FolderIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">{msg.ui_no_categories_found()}</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters ? msg.ui_try_clearing_filters() : msg.ui_add_first_category()}
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4 @[768px]/main:grid-cols-2 @[1024px]/main:grid-cols-3">
        {#each allCategories as category (category.id)}
          <Card.Root class="group transition-all duration-200 hover:shadow-md">
            <Card.Header>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full"
                  >
                    <FolderIcon class="text-primary size-5" />
                  </div>
                  <div>
                    <Card.Title class="text-base">{category.name}</Card.Title>
                    {#if category.description}
                      <Card.Description class="line-clamp-1"
                        >{category.description}</Card.Description
                      >
                    {/if}
                  </div>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: "ghost", size: "icon" }) +
                      " size-8 opacity-0 group-hover:opacity-100"}
                  >
                    <MoreVerticalIcon class="size-4" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" class="min-w-max">
                    <DropdownMenu.Item onclick={() => handleManageProducts(category)}>
                      <ListPlusIcon class="size-4" />
                      {msg.ui_manage_products()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => handleEditCategory(category)}>
                      <PencilIcon class="size-4" />
                      {msg.ui_edit()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-red-600"
                      onclick={() => handleDeleteCategory(category)}
                    >
                      <Trash2Icon class="size-4" />
                      {msg.ui_delete()}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </Card.Header>
            <Card.Content>
              <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">{msg.ui_products()}</p>
                  <p class="font-semibold">
                    {category.productCount}
                    {category.productCount === 1 ? "product" : "products"}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>

      {#if categories.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => categories.fetchNextPage()}
            disabled={categories.isFetchingNextPage}
          >
            {#if categories.isFetchingNextPage}
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

{#if isAddOpen}
  <AddCategoryDialog open={true} onClose={() => (isAddOpen = false)} />
{/if}

{#if editingCategory}
  <EditCategoryDialog
    open={true}
    onClose={() => (editingCategory = null)}
    category={editingCategory}
  />
{/if}

{#if managingCategory}
  <ManageCategoryProductsDialog
    open={true}
    onClose={() => (managingCategory = null)}
    category={managingCategory}
  />
{/if}
