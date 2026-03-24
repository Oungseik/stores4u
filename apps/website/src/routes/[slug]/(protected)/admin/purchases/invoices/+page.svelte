<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SearchIcon from "@lucide/svelte/icons/search";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import XIcon from "@lucide/svelte/icons/x";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { Debounced } from "runed";
  import { useSearchParams } from "runed/kit";

  import StatsCard from "$lib/components/cards/StatsCard.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";
  import DataTable from "$lib/components/tables/DataTable.svelte";
  import { createColumns } from "$lib/components/tables/invoices/columns";
  import { invoicesFilterSchema } from "$lib/search_param";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  const columns = $derived(createColumns(shop.country));

  // Mock invoices data
  const mockInvoices = [
    {
      id: "INV-2025-001",
      supplier: "Tech Supplies Co.",
      date: "2025-01-15",
      status: "validated",
      totalCents: 154990,
      items: 12,
      vatCents: 10000,
      discountCents: 5000,
      freightCents: 2000,
      subtotalCents: 147990,
    },
    {
      id: "INV-2025-002",
      supplier: "Office Depot",
      date: "2025-01-14",
      status: "pending",
      totalCents: 45990,
      items: 5,
      vatCents: 3000,
      discountCents: 0,
      freightCents: 1500,
      subtotalCents: 41490,
    },
    {
      id: "INV-2025-003",
      supplier: "Global Electronics",
      date: "2025-01-12",
      status: "auto_accepted",
      totalCents: 289900,
      items: 8,
      vatCents: 20000,
      discountCents: 10000,
      freightCents: 5000,
      subtotalCents: 274900,
    },
    {
      id: "INV-2025-004",
      supplier: "Stationery Plus",
      date: "2025-01-10",
      status: "rejected",
      totalCents: 12350,
      items: 3,
      vatCents: 1000,
      discountCents: 0,
      freightCents: 500,
      subtotalCents: 10850,
    },
    {
      id: "INV-2025-005",
      supplier: "Tech Supplies Co.",
      date: "2025-01-08",
      status: "validated",
      totalCents: 67800,
      items: 6,
      vatCents: 5000,
      discountCents: 2000,
      freightCents: 1000,
      subtotalCents: 63800,
    },
    {
      id: "INV-2025-006",
      supplier: "Computer World",
      date: "2025-01-06",
      status: "pending",
      totalCents: 234500,
      items: 15,
      vatCents: 15000,
      discountCents: 8000,
      freightCents: 3000,
      subtotalCents: 230500,
    },
    {
      id: "INV-2025-007",
      supplier: "Office Depot",
      date: "2025-01-04",
      status: "validated",
      totalCents: 89200,
      items: 7,
      vatCents: 6000,
      discountCents: 3000,
      freightCents: 2000,
      subtotalCents: 84200,
    },
    {
      id: "INV-2025-008",
      supplier: "Tech Supplies Co.",
      date: "2025-01-02",
      status: "auto_accepted",
      totalCents: 145600,
      items: 10,
      vatCents: 12000,
      discountCents: 6000,
      freightCents: 2500,
      subtotalCents: 137100,
    },
  ];

  const searchParams = useSearchParams(invoicesFilterSchema);
  const debouncedSearch = new Debounced(() => searchParams.search, 1000);
  const debouncedStatus = new Debounced(() => searchParams.status, 300);

  // Filter invoices
  const filteredInvoices = $derived(
    mockInvoices.filter((invoice) => {
      const search = debouncedSearch.current.toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        invoice.id.toLowerCase().includes(search) ||
        invoice.supplier.toLowerCase().includes(search);

      const status = debouncedStatus.current;
      const matchesStatus = status.length > 0 ? invoice.status === status : true;

      return matchesSearch && matchesStatus;
    })
  );

  const hasFilters = $derived(searchParams.search.length > 0 || searchParams.status.length > 0);

  function resetFilters() {
    searchParams.update({ search: "", status: "" });
  }

  // Stats
  const stats = $derived({
    total: mockInvoices.length,
    pending: mockInvoices.filter((i) => i.status === "pending").length,
    validated: mockInvoices.filter((i) => i.status === "validated").length,
    totalValue: mockInvoices.reduce((sum, i) => sum + i.totalCents, 0),
  });

  const statusOptions = [
    {
      value: "validated",
      label: "Validated",
      count: mockInvoices.filter((i) => i.status === "validated").length,
    },
    {
      value: "pending",
      label: "Pending",
      count: mockInvoices.filter((i) => i.status === "pending").length,
    },
    {
      value: "auto_accepted",
      label: "Auto Accepted",
      count: mockInvoices.filter((i) => i.status === "auto_accepted").length,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: mockInvoices.filter((i) => i.status === "rejected").length,
    },
  ];
</script>

<div class="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
  <AdminDashboardHeader
    breadcrumbs={[
      { label: "Dashboard", href: `/${shop.slug}/admin` },
      { label: "Purchases", href: `/${shop.slug}/admin/purchases` },
      { label: "Invoices" },
    ]}
  >
    {#snippet actions()}
      <a href={`/${shop.slug}/admin/purchases/upload`} class={buttonVariants()}>
        <UploadIcon class="mr-2 size-4" />
        Upload Invoice
      </a>
    {/snippet}
  </AdminDashboardHeader>

  <!-- Page Title -->
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p class="text-muted-foreground text-sm">Manage and track all supplier invoices</p>
      </div>
      <Button variant="outline">
        <DownloadIcon class="mr-2 size-4" />
        Export
      </Button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Total Invoices"
      value={stats.total}
      description="All time"
      icon={ReceiptIcon}
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
      borderClass="from-primary/20 to-primary/5"
    />
    <StatsCard
      title="Pending Review"
      value={stats.pending}
      description="Awaiting action"
      icon={ClockIcon}
      iconBgClass="bg-amber-500/10"
      iconTextClass="text-amber-600"
      borderClass="from-amber-500/20 to-amber-500/5"
    />
    <StatsCard
      title="Validated"
      value={stats.validated}
      description="Approved invoices"
      icon={ReceiptIcon}
      iconBgClass="bg-emerald-500/10"
      iconTextClass="text-emerald-600"
      borderClass="from-emerald-500/20 to-emerald-500/5"
    />
    <StatsCard
      title="Total Value"
      value=""
      description="All invoices"
      icon={ReceiptIcon}
      iconBgClass="bg-blue-500/10"
      iconTextClass="text-blue-600"
      borderClass="from-blue-500/20 to-blue-500/5"
      price={stats.totalValue}
      country={shop.country}
    />
  </div>

  <!-- Filters -->
  <div class="flex flex-col items-center items-start justify-start gap-2 lg:flex-row">
    <div class="flex w-full items-center gap-2 lg:max-w-md">
      <div class="relative w-full">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search invoices, suppliers..."
          class="pl-9"
          value={searchParams.search}
          oninput={(e) => searchParams.update({ search: e.currentTarget.value })}
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <FilterIcon class="size-4" />
          {searchParams.status.length > 0
            ? (statusOptions.find((s) => s.value === searchParams.status)?.label ?? "Filter Status")
            : "All Statuses"}
          <ChevronDownIcon class="size-3 opacity-50" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-48">
          <DropdownMenu.Label>Filter by Status</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each statusOptions as option}
            <DropdownMenu.Item
              onclick={() =>
                searchParams.update({
                  status: searchParams.status === option.value ? "" : option.value,
                })}
              class="justify-between"
            >
              <span class="flex-1">{option.label}</span>
              <span class="text-muted-foreground text-xs">{option.count}</span>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if hasFilters}
        <Button variant="ghost" size="sm" onclick={resetFilters}>
          <XIcon class="size-4" />
          Reset
        </Button>
      {/if}
    </div>
  </div>

  <!-- Invoices Table -->
  <DataTable {columns} data={filteredInvoices} loading={false} />
</div>
