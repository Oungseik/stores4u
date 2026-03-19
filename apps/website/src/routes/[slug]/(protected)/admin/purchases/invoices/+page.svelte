<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import FilterIcon from "@lucide/svelte/icons/filter";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { Badge } from "@repo/ui/badge";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import * as Table from "@repo/ui/table";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  import Pricing from "$lib/components/Pricing.svelte";
  import AdminDashboardHeader from "$lib/components/headers/AdminDashboardHeader.svelte";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // Mock invoices data
  const mockInvoices = [
    {
      id: "INV-2025-001",
      supplier: "Tech Supplies Co.",
      date: "2025-01-15",
      status: "validated",
      totalCents: 154990,
      items: 12,
      taxCents: 10000,
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
      taxCents: 3000,
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
      taxCents: 20000,
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
      taxCents: 1000,
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
      taxCents: 5000,
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
      taxCents: 15000,
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
      taxCents: 6000,
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
      taxCents: 12000,
      discountCents: 6000,
      freightCents: 2500,
      subtotalCents: 137100,
    },
  ];

  // State
  let searchQuery = $state("");
  let selectedStatus = $state<string | null>(null);
  let expandedInvoice = $state<string | null>(null);

  // Filter invoices
  const filteredInvoices = $derived(() => {
    return mockInvoices.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus ? invoice.status === selectedStatus : true;

      return matchesSearch && matchesStatus;
    });
  });

  // Stats
  const stats = $derived(() => {
    const total = mockInvoices.length;
    const pending = mockInvoices.filter((i) => i.status === "pending").length;
    const validated = mockInvoices.filter((i) => i.status === "validated").length;
    const totalValue = mockInvoices.reduce((sum, i) => sum + i.totalCents, 0);

    return { total, pending, validated, totalValue };
  });

  // Status badge variants
  function getStatusBadge(status: string) {
    switch (status) {
      case "validated":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
      case "auto_accepted":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-50";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50";
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function toggleExpand(invoiceId: string) {
    expandedInvoice = expandedInvoice === invoiceId ? null : invoiceId;
  }

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
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Invoices</Card.Title>
        <ReceiptIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().total}</div>
        <p class="text-muted-foreground text-xs">All time</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Pending Review</Card.Title>
        <ClockIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().pending}</div>
        <p class="text-muted-foreground text-xs">Awaiting action</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Validated</Card.Title>
        <ReceiptIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().validated}</div>
        <p class="text-muted-foreground text-xs">Approved invoices</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Value</Card.Title>
        <ReceiptIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          <Pricing cents={stats().totalValue} country={shop.country} />
        </div>
        <p class="text-muted-foreground text-xs">All invoices</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters -->
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div class="flex flex-1 items-center gap-2">
      <div class="relative max-w-md flex-1">
        <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search invoices, suppliers..." class="pl-9" bind:value={searchQuery} />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <FilterIcon class="size-4" />
          {selectedStatus
            ? statusOptions.find((s) => s.value === selectedStatus)?.label
            : "Filter Status"}
          <ChevronDownIcon class="size-3 opacity-50" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-48">
          <DropdownMenu.Label>Filter by Status</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each statusOptions as option}
            <DropdownMenu.Item
              onclick={() => (selectedStatus = option.value)}
              class="justify-between"
            >
              {option.label}
              <span class="text-muted-foreground text-xs">{option.count}</span>
            </DropdownMenu.Item>
          {/each}
          {#if selectedStatus}
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={() => (selectedStatus = null)}>
              Clear filter
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {#if selectedStatus || searchQuery}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => {
            selectedStatus = null;
            searchQuery = "";
          }}
        >
          Clear filters
        </Button>
      {/if}
    </div>
  </div>

  <!-- Status Filter Pills -->
  <div class="flex flex-wrap gap-2">
    {#each statusOptions as option}
      <button
        type="button"
        class={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          selectedStatus === option.value
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        ]}
        onclick={() => (selectedStatus = selectedStatus === option.value ? null : option.value)}
      >
        {option.label}
        <span
          class={[
            "rounded-full px-1.5 py-0.5 text-[10px]",
            selectedStatus === option.value ? "bg-primary-foreground/20" : "bg-background",
          ]}
        >
          {option.count}
        </span>
      </button>
    {/each}
  </div>

  <!-- Invoices Table -->
  <Card.Root>
    <Card.Content class="p-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-10"></Table.Head>
            <Table.Head>Invoice</Table.Head>
            <Table.Head>Supplier</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head class="text-center">Items</Table.Head>
            <Table.Head class="text-right">Total</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filteredInvoices() as invoice}
            <Table.Row
              class="hover:bg-muted/50 cursor-pointer"
              onclick={() => toggleExpand(invoice.id)}
            >
              <Table.Cell>
                <ReceiptIcon class="text-muted-foreground size-4" />
              </Table.Cell>
              <Table.Cell class="font-medium">{invoice.id}</Table.Cell>
              <Table.Cell>{invoice.supplier}</Table.Cell>
              <Table.Cell>
                <div class="text-muted-foreground flex items-center gap-1">
                  <CalendarIcon class="size-3" />
                  {formatDate(invoice.date)}
                </div>
              </Table.Cell>
              <Table.Cell class="text-center">{invoice.items}</Table.Cell>
              <Table.Cell class="text-right font-medium">
                <Pricing cents={invoice.totalCents} country={shop.country} />
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class={getStatusBadge(invoice.status)}>
                  {invoice.status.replace("_", " ")}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class={buttonVariants({ variant: "ghost", size: "icon" }) + " size-8"}
                    onclick={(e) => e.stopPropagation()}
                  >
                    <MoreVerticalIcon class="size-4" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item>
                      <EyeIcon class="mr-2 size-4" />
                      View Details
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <PencilIcon class="mr-2 size-4" />
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item class="text-red-600">
                      <Trash2Icon class="mr-2 size-4" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
            {#if expandedInvoice === invoice.id}
              <Table.Row>
                <Table.Cell colspan={8}>
                  <div
                    class="bg-muted/50 border-t px-4 py-4"
                    transition:slide={{ duration: 200, easing: cubicOut }}
                  >
                    <div class="grid gap-4 md:grid-cols-2">
                      <!-- Invoice Breakdown -->
                      <div>
                        <h4
                          class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase"
                        >
                          Invoice Breakdown
                        </h4>
                        <div class="bg-background space-y-2 rounded-md border p-3 text-sm">
                          <div class="flex justify-between">
                            <span class="text-muted-foreground">Subtotal</span>
                            <Pricing cents={invoice.subtotalCents} country={shop.country} />
                          </div>
                          <div class="flex justify-between">
                            <span class="text-muted-foreground">Tax</span>
                            <Pricing cents={invoice.taxCents} country={shop.country} />
                          </div>
                          {#if invoice.discountCents > 0}
                            <div class="flex justify-between text-red-600">
                              <span>Discount</span>
                              <span
                                >-<Pricing
                                  cents={invoice.discountCents}
                                  country={shop.country}
                                /></span
                              >
                            </div>
                          {/if}
                          <div class="flex justify-between">
                            <span class="text-muted-foreground">Freight</span>
                            <Pricing cents={invoice.freightCents} country={shop.country} />
                          </div>
                          <div class="flex justify-between border-t pt-2 font-semibold">
                            <span>Total</span>
                            <Pricing cents={invoice.totalCents} country={shop.country} />
                          </div>
                        </div>
                      </div>

                      <!-- Actions -->
                      <div>
                        <h4
                          class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase"
                        >
                          Actions
                        </h4>
                        <div class="bg-background space-y-2 rounded-md border p-3">
                          {#if invoice.status === "pending"}
                            <Button class="w-full" size="sm">
                              <ReceiptIcon class="mr-2 size-4" />
                              Validate Invoice
                            </Button>
                          {/if}
                          <Button variant="outline" class="w-full" size="sm">
                            <DownloadIcon class="mr-2 size-4" />
                            Download PDF
                          </Button>
                          <Button variant="outline" class="w-full" size="sm">
                            <PencilIcon class="mr-2 size-4" />
                            Edit Invoice
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/if}
          {/each}
        </Table.Body>
      </Table.Root>

      {#if filteredInvoices().length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
            <ReceiptIcon class="text-muted-foreground size-8" />
          </div>
          <h3 class="text-lg font-semibold">No invoices found</h3>
          <p class="text-muted-foreground max-w-sm text-sm">
            {searchQuery || selectedStatus
              ? "Try adjusting your search or filters"
              : "Invoices will appear here when you upload supplier invoices"}
          </p>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
