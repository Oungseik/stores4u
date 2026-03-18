<script lang="ts">
  import Building2Icon from "@lucide/svelte/icons/building-2";
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import MailIcon from "@lucide/svelte/icons/mail";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import SearchIcon from "@lucide/svelte/icons/search";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import UserIcon from "@lucide/svelte/icons/user";
  import * as Breadcrumb from "@repo/ui/breadcrumb";
  import { Button, buttonVariants } from "@repo/ui/button";
  import * as Card from "@repo/ui/card";
  import * as Dialog from "@repo/ui/dialog";
  import * as DropdownMenu from "@repo/ui/dropdown-menu";
  import { Input } from "@repo/ui/input";
  import { Label } from "@repo/ui/label";
  import { Separator } from "@repo/ui/separator";
  import * as Sidebar from "@repo/ui/sidebar";
  import { Textarea } from "@repo/ui/textarea";

  import Pricing from "$lib/components/Pricing.svelte";

  import type { PageProps } from "./$types";

  const { data: shop }: PageProps = $props();

  // Mock suppliers data
  const mockSuppliers = [
    {
      id: "sup-1",
      name: "Tech Supplies Co.",
      contactName: "John Smith",
      phone: "+1 555-0123",
      email: "john@techsupplies.com",
      address: "123 Tech Street, Silicon Valley, CA 94025",
      paymentTerms: "Net 30",
      invoicesCount: 15,
      totalPurchases: 1250000,
      lastPurchase: "2025-01-15",
    },
    {
      id: "sup-2",
      name: "Office Depot",
      contactName: "Sarah Johnson",
      phone: "+1 555-0456",
      email: "sarah@officedepot.com",
      address: "456 Office Ave, Business City, NY 10001",
      paymentTerms: "Net 15",
      invoicesCount: 8,
      totalPurchases: 450000,
      lastPurchase: "2025-01-14",
    },
    {
      id: "sup-3",
      name: "Global Electronics",
      contactName: "Mike Chen",
      phone: "+1 555-0789",
      email: "mike@globalelec.com",
      address: "789 Global Blvd, Electronics Town, TX 75001",
      paymentTerms: "Net 45",
      invoicesCount: 12,
      totalPurchases: 2100000,
      lastPurchase: "2025-01-12",
    },
    {
      id: "sup-4",
      name: "Stationery Plus",
      contactName: "Emily Brown",
      phone: "+1 555-0321",
      email: "emily@stationeryplus.com",
      address: "321 Stationery Lane, Paper City, FL 33101",
      paymentTerms: "Net 30",
      invoicesCount: 6,
      totalPurchases: 125000,
      lastPurchase: "2025-01-10",
    },
    {
      id: "sup-5",
      name: "Computer World",
      contactName: "David Lee",
      phone: "+1 555-0654",
      email: "david@computerworld.com",
      address: "654 Computer Way, Digital City, WA 98001",
      paymentTerms: "Net 60",
      invoicesCount: 20,
      totalPurchases: 3200000,
      lastPurchase: "2025-01-06",
    },
    {
      id: "sup-6",
      name: "Supply Chain Inc",
      contactName: "Lisa Anderson",
      phone: "+1 555-0987",
      email: "lisa@supplychain.com",
      address: "987 Supply Rd, Logistics City, IL 60601",
      paymentTerms: "Net 30",
      invoicesCount: 4,
      totalPurchases: 85000,
      lastPurchase: "2025-01-03",
    },
    {
      id: "sup-7",
      name: "Digital Solutions",
      contactName: "Robert Taylor",
      phone: "+1 555-0156",
      email: "robert@digitalsolutions.com",
      address: "156 Digital Blvd, Tech Hub, CA 90210",
      paymentTerms: "Net 15",
      invoicesCount: 10,
      totalPurchases: 780000,
      lastPurchase: "2025-01-01",
    },
    {
      id: "sup-8",
      name: "Premium Supplies",
      contactName: "Jennifer White",
      phone: "+1 555-0278",
      email: "jennifer@premiumsupplies.com",
      address: "278 Premium St, Quality City, MA 02101",
      paymentTerms: "Net 30",
      invoicesCount: 3,
      totalPurchases: 45000,
      lastPurchase: "2024-12-28",
    },
  ];

  // State
  let searchQuery = $state("");
  let selectedSupplier = $state<(typeof mockSuppliers)[0] | null>(null);
  let isViewOpen = $state(false);
  let isAddOpen = $state(false);
  let isEditOpen = $state(false);

  // New supplier form
  let newSupplier = $state({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    paymentTerms: "Net 30",
  });

  // Filter suppliers
  const filteredSuppliers = $derived(() => {
    return mockSuppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Stats
  const stats = $derived(() => {
    const total = mockSuppliers.length;
    const totalPurchases = mockSuppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
    const totalInvoices = mockSuppliers.reduce((sum, s) => sum + s.invoicesCount, 0);
    const avgInvoices = Math.round(totalInvoices / total);

    return { total, totalPurchases, totalInvoices, avgInvoices };
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function viewSupplier(supplier: (typeof mockSuppliers)[0]) {
    selectedSupplier = supplier;
    isViewOpen = true;
  }

  function editSupplier(supplier: (typeof mockSuppliers)[0]) {
    selectedSupplier = supplier;
    newSupplier = { ...supplier };
    isEditOpen = true;
  }

  function saveNewSupplier() {
    // Mock: Add new supplier
    isAddOpen = false;
    newSupplier = {
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      paymentTerms: "Net 30",
    };
  }

  function saveEditedSupplier() {
    // Mock: Save edited supplier
    isEditOpen = false;
    selectedSupplier = null;
  }

  function deleteSupplier(supplierId: string) {
    // Mock: Delete supplier
    alert(`Delete supplier ${supplierId}`);
  }
</script>

<div class="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4">
    <div class="flex h-9 items-center justify-between">
      <div class="flex items-center gap-1 lg:gap-2">
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${shop.slug}/admin`}>Dashboard</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link href={`/${shop.slug}/admin/purchases`}>Purchases</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Suppliers</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </div>
  </div>

  <!-- Page Title -->
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p class="text-muted-foreground text-sm">Manage supplier information and relationships</p>
      </div>
      <Button onclick={() => (isAddOpen = true)}>
        <PlusIcon class="size-4" />
        Add Supplier
      </Button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Suppliers</Card.Title>
        <Building2Icon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().total}</div>
        <p class="text-muted-foreground text-xs">Active suppliers</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Purchases</Card.Title>
        <DollarSignIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          <Pricing cents={stats().totalPurchases} country={shop.country} />
        </div>
        <p class="text-muted-foreground text-xs">All time</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Invoices</Card.Title>
        <ReceiptIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().totalInvoices}</div>
        <p class="text-muted-foreground text-xs">From all suppliers</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Avg Invoices</Card.Title>
        <FileTextIcon class="text-muted-foreground size-4" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stats().avgInvoices}</div>
        <p class="text-muted-foreground text-xs">Per supplier</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Search -->
  <div class="flex items-center gap-2">
    <div class="relative max-w-md flex-1">
      <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        placeholder="Search suppliers by name, contact, or email..."
        class="pl-9"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Suppliers Grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each filteredSuppliers() as supplier}
      <Card.Root class="group transition-all duration-200 hover:shadow-md">
        <Card.Header class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                <Building2Icon class="text-primary size-5" />
              </div>
              <div>
                <Card.Title class="text-base">{supplier.name}</Card.Title>
                <Card.Description class="flex items-center gap-1">
                  <UserIcon class="size-3" />
                  {supplier.contactName}
                </Card.Description>
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
                <DropdownMenu.Item onclick={() => viewSupplier(supplier)}>
                  <EyeIcon class="size-4" />
                  View Details
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => editSupplier(supplier)}>
                  <PencilIcon class="size-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="text-red-600" onclick={() => deleteSupplier(supplier.id)}>
                  <Trash2Icon class="size-4" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </Card.Header>
        <Card.Content class="space-y-3">
          <div class="space-y-1 text-sm">
            <div class="text-muted-foreground flex items-center gap-2">
              <MailIcon class="size-3" />
              <span class="truncate">{supplier.email}</span>
            </div>
            <div class="text-muted-foreground flex items-center gap-2">
              <PhoneIcon class="size-3" />
              <span>{supplier.phone}</span>
            </div>
          </div>

          <div class="bg-muted flex items-center justify-between rounded-md p-3 text-sm">
            <div>
              <p class="text-muted-foreground text-xs">Total Purchases</p>
              <p class="font-semibold">
                <Pricing cents={supplier.totalPurchases} country={shop.country} />
              </p>
            </div>
            <div class="text-right">
              <p class="text-muted-foreground text-xs">Invoices</p>
              <p class="font-semibold">{supplier.invoicesCount}</p>
            </div>
          </div>

          <div class="text-muted-foreground flex items-center gap-2 text-xs">
            <ReceiptIcon class="size-3" />
            Last purchase: {formatDate(supplier.lastPurchase)}
          </div>
        </Card.Content>
        <Card.Footer class="pt-0">
          <Button variant="outline" class="w-full" onclick={() => viewSupplier(supplier)}>
            View Details
          </Button>
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>

  {#if filteredSuppliers().length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <Building2Icon class="text-muted-foreground size-8" />
      </div>
      <h3 class="text-lg font-semibold">No suppliers found</h3>
      <p class="text-muted-foreground max-w-sm text-sm">
        {searchQuery ? "Try adjusting your search terms" : "Add your first supplier to get started"}
      </p>
      {#if !searchQuery}
        <Button class="mt-4" onclick={() => (isAddOpen = true)}>
          <PlusIcon class="size-4" />
          Add Supplier
        </Button>
      {/if}
    </div>
  {/if}
</div>

<!-- View Supplier Dialog -->
<Dialog.Root bind:open={isViewOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    {#if selectedSupplier}
      <Dialog.Header>
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
            <Building2Icon class="text-primary size-5" />
          </div>
          <div>
            <Dialog.Title class="text-xl">{selectedSupplier.name}</Dialog.Title>
            <Dialog.Description>Supplier details and history</Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <div class="grid gap-6 py-4">
        <!-- Contact Info -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Contact Information
          </h4>
          <div class="space-y-2 rounded-md border p-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Contact Person</span>
              <span class="font-medium">{selectedSupplier.contactName}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Phone</span>
              <span>{selectedSupplier.phone}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Email</span>
              <span>{selectedSupplier.email}</span>
            </div>
            <div class="flex items-start justify-between">
              <span class="text-muted-foreground">Address</span>
              <span class="max-w-xs text-right">{selectedSupplier.address}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Payment Terms</span>
              <span class="font-medium">{selectedSupplier.paymentTerms}</span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Purchase History
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">
                <Pricing cents={selectedSupplier.totalPurchases} country={shop.country} />
              </p>
              <p class="text-muted-foreground text-xs">Total Purchases</p>
            </div>
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">{selectedSupplier.invoicesCount}</p>
              <p class="text-muted-foreground text-xs">Invoices</p>
            </div>
            <div class="rounded-md border p-3 text-center">
              <p class="text-lg font-bold">{formatDate(selectedSupplier.lastPurchase)}</p>
              <p class="text-muted-foreground text-xs">Last Purchase</p>
            </div>
          </div>
        </div>

        <!-- Recent Activity Placeholder -->
        <div>
          <h4 class="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Recent Invoices
          </h4>
          <div class="text-muted-foreground rounded-md border p-3 text-center text-sm">
            <p>View all invoices from this supplier on the invoices page</p>
            <Button variant="outline" class="mt-2" size="sm">View Invoices</Button>
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (isViewOpen = false)}>Close</Button>
        <Button
          onclick={() => {
            isViewOpen = false;
            // editSupplier(selectedSupplier);
          }}
        >
          <PencilIcon class="size-4" />
          Edit Supplier
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Add Supplier Dialog -->
<Dialog.Root bind:open={isAddOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Add New Supplier</Dialog.Title>
      <Dialog.Description>Create a new supplier in your system</Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="new-name">Supplier Name</Label>
        <Input id="new-name" bind:value={newSupplier.name} placeholder="Enter supplier name" />
      </div>

      <div class="grid gap-2">
        <Label for="new-contact">Contact Person</Label>
        <Input
          id="new-contact"
          bind:value={newSupplier.contactName}
          placeholder="Enter contact name"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="new-phone">Phone</Label>
          <Input id="new-phone" bind:value={newSupplier.phone} placeholder="+1 555-0000" />
        </div>
        <div class="grid gap-2">
          <Label for="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            bind:value={newSupplier.email}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div class="grid gap-2">
        <Label for="new-address">Address</Label>
        <Textarea
          id="new-address"
          bind:value={newSupplier.address}
          placeholder="Enter full address"
        />
      </div>

      <div class="grid gap-2">
        <Label for="new-terms">Payment Terms</Label>
        <Input id="new-terms" bind:value={newSupplier.paymentTerms} placeholder="Net 30" />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isAddOpen = false)}>Cancel</Button>
      <Button onclick={saveNewSupplier} disabled={!newSupplier.name}>Submit</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Supplier Dialog -->
<Dialog.Root bind:open={isEditOpen}>
  <Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
    {#if selectedSupplier}
      <Dialog.Header>
        <Dialog.Title>Edit Supplier</Dialog.Title>
        <Dialog.Description>Update supplier information</Dialog.Description>
      </Dialog.Header>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="edit-name">Supplier Name</Label>
          <Input id="edit-name" bind:value={newSupplier.name} placeholder="Enter supplier name" />
        </div>

        <div class="grid gap-2">
          <Label for="edit-contact">Contact Person</Label>
          <Input
            id="edit-contact"
            bind:value={newSupplier.contactName}
            placeholder="Enter contact name"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="edit-phone">Phone</Label>
            <Input id="edit-phone" bind:value={newSupplier.phone} placeholder="+1 555-0000" />
          </div>
          <div class="grid gap-2">
            <Label for="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              bind:value={newSupplier.email}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="edit-address">Address</Label>
          <Textarea
            id="edit-address"
            bind:value={newSupplier.address}
            placeholder="Enter full address"
          />
        </div>

        <div class="grid gap-2">
          <Label for="edit-terms">Payment Terms</Label>
          <Input id="edit-terms" bind:value={newSupplier.paymentTerms} placeholder="Net 30" />
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (isEditOpen = false)}>Cancel</Button>
        <Button onclick={saveEditedSupplier}>
          <PencilIcon class="size-4" />
          Save Changes
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
