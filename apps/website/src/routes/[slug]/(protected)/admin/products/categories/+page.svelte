<script lang="ts">
  import FolderIcon from "@lucide/svelte/icons/folder";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import * as FilterBar from "@repo/ui/filter-bar";
  import { ToggleGroup, ToggleGroupItem } from "@repo/ui/toggle-group";
  import { createInfiniteQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";
  import z from "zod";

  import CategoryForm from "$lib/components/forms/CategoryForm.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { type CategoryItem, createColumns } from "$lib/components/tables/categories/columns";
  import { orpc } from "$lib/orpc_client";

  import type { PageProps } from "./$types";

  const categoriesFilterSchema = z.object({
    search: z.string().default(""),
    view: z.enum(["card", "table"]).default("card"),
  });

  type CategoriesView = z.infer<typeof categoriesFilterSchema>["view"];

  const { params, data: shop }: PageProps = $props();

  const searchParams = useSearchParams(categoriesFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);

  const categories = createInfiniteQuery(() =>
    orpc.categories.list.infiniteOptions({
      initialPageParam: undefined as string | undefined,
      input: (cursor) => ({
        pageSize: 20,
        cursor,
        slug: params.slug,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!params.slug,
    })
  );

  const allCategories = $derived(
    (categories.data?.pages.flatMap((page) => page.items) ?? []).filter((c) =>
      debouncedSearch.current
        ? c.name.toLowerCase().includes(debouncedSearch.current.toLowerCase())
        : true
    )
  );

  const hasFilters = $derived(searchParams.search.length > 0);

  function resetFilters() {
    searchParams.update({ search: "" });
  }

  let selectedCategory = $state<CategoryItem | null>(null);
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);
  let isDeleteOpen = $state(false);
  // svelte-ignore non_reactive_update
  let addFormRef: CategoryForm | null = null;
  // svelte-ignore non_reactive_update
  let editFormRef: CategoryForm | null = null;

  function editCategory(category: CategoryItem) {
    selectedCategory = category;
    isEditOpen = true;
  }

  function deleteCategory(category: CategoryItem) {
    selectedCategory = category;
    isDeleteOpen = true;
  }

  const queryClient = useQueryClient();

  const deleteMutation = createMutation(() =>
    orpc.categories.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Category deleted successfully");
        queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
        isDeleteOpen = false;
        selectedCategory = null;
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete category");
      },
    })
  );

  function handleDelete() {
    if (selectedCategory) {
      deleteMutation.mutate({
        slug: params.slug,
        id: selectedCategory.id,
      });
    }
  }

  const columns = $derived(createColumns(params.slug, editCategory, deleteCategory));
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Products", href: `/${shop.slug}/admin/products` },
      { label: "Categories" },
    ]}
  >
    {#snippet actions()}
      <Button onclick={() => (isAddOpen = true)}>
        <PlusIcon class="size-4" />
        Add Category
      </Button>
    {/snippet}
  </AdminDashboardHeader>

  <section class="space-y-6">
    <FilterBar.Root {hasFilters} onReset={resetFilters} class="justify-between">
      <div class="flex items-center justify-start gap-4">
        <FilterBar.Search
          placeholder="Search categories..."
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
        <FilterBar.Reset />
      </div>

      <ToggleGroup
        type="single"
        value={searchParams.view}
        onValueChange={(value) => {
          if (value && (value === "card" || value === "table")) {
            searchParams.update({ view: value as CategoriesView });
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

    {#if categories.isLoading}
      <div class="flex items-center justify-center py-12">
        <Loader2Icon class="text-muted-foreground size-6 animate-spin" />
      </div>
    {:else if categories.isError}
      <div class="flex items-center justify-center py-12">
        <p class="text-red-500">Failed to load categories</p>
      </div>
    {:else if allCategories.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <FolderIcon class="text-muted-foreground size-8" />
        </div>
        <h3 class="text-lg font-semibold">No categories found</h3>
        <p class="text-muted-foreground max-w-sm text-sm">
          {hasFilters
            ? "Try adjusting your search terms"
            : "Add your first category to organize your products"}
        </p>
        {#if !hasFilters}
          <Button class="mt-4" onclick={() => (isAddOpen = true)}>
            <PlusIcon class="size-4" />
            Add Category
          </Button>
        {/if}
      </div>
    {:else if searchParams.view === "table"}
      <DataTable {columns} data={allCategories} loading={false} />

      {#if categories.hasNextPage}
        <div class="mt-4 flex justify-center">
          <Button
            variant="outline"
            onclick={() => categories.fetchNextPage()}
            disabled={categories.isFetchingNextPage}
          >
            {#if categories.isFetchingNextPage}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
              Loading...
            {:else}
              Load More
            {/if}
          </Button>
        </div>
      {/if}
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each allCategories as category (category.id)}
          <Card.Root class="group transition-all duration-200 hover:shadow-md">
            <Card.Header class="pb-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
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
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item onclick={() => editCategory(category)}>
                      <PencilIcon class="size-4" />
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-red-600"
                      onclick={() => deleteCategory(category)}
                    >
                      <Trash2Icon class="size-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </Card.Header>
            <Card.Content>
              <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
                <div>
                  <p class="text-muted-foreground text-xs">Products</p>
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

<!-- Add Category Dialog -->
<Dialog.Root
  bind:open={isAddOpen}
  onOpenChange={(open) => {
    if (!open) addFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Add New Category</Dialog.Title>
      <Dialog.Description>Create a new category to organize your products</Dialog.Description>
    </Dialog.Header>

    <CategoryForm
      bind:this={addFormRef}
      slug={params.slug}
      onSuccess={() => {
        isAddOpen = false;
        addFormRef?.resetForm();
      }}
      onCancel={() => {
        isAddOpen = false;
        addFormRef?.resetForm();
      }}
    />
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Category Dialog -->
<Dialog.Root
  bind:open={isEditOpen}
  onOpenChange={(open) => {
    if (!open) editFormRef?.resetForm();
  }}
>
  <Dialog.Content class="max-h-[90vh] max-w-xl overflow-y-auto">
    {#if selectedCategory}
      <Dialog.Header>
        <Dialog.Title>Edit Category</Dialog.Title>
        <Dialog.Description>Update category information</Dialog.Description>
      </Dialog.Header>

      {#key selectedCategory.id}
        <CategoryForm
          bind:this={editFormRef}
          slug={params.slug}
          initialData={{
            id: selectedCategory.id,
            name: selectedCategory.name,
            description: selectedCategory.description,
          }}
          onSuccess={() => {
            isEditOpen = false;
            selectedCategory = null;
            editFormRef?.resetForm();
          }}
          onCancel={() => {
            isEditOpen = false;
            editFormRef?.resetForm();
          }}
        />
      {/key}
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={isDeleteOpen}>
  <Dialog.Content class="max-w-xl">
    <Dialog.Header>
      <Dialog.Title>Delete Category</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete "{selectedCategory?.name}"?
        {#if selectedCategory && selectedCategory.productCount > 0}
          <span class="mt-2 block text-amber-600">
            This category has {selectedCategory.productCount} product{selectedCategory.productCount >
            1
              ? "s"
              : ""} associated with it. You must remove the category from those products first.
          </span>
        {:else}
          <span class="mt-2 block">This action cannot be undone.</span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isDeleteOpen = false)}>Cancel</Button>
      <Button
        variant="destructive"
        onclick={handleDelete}
        disabled={deleteMutation.isPending || (selectedCategory?.productCount ?? 0) > 0}
      >
        {#if deleteMutation.isPending}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Deleting...
        {:else}
          Delete
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
