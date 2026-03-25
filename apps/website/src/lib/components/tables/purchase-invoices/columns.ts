import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";
import ActionsCell from "./cells/ActionsCell.svelte";
import DateCell from "./cells/DateCell.svelte";
import InvoiceIdCell from "./cells/InvoiceNumberCell.svelte";
import PriceCell from "./cells/PriceCell.svelte";
import StatusCell from "./cells/StatusCell.svelte";

export type PurchaseInvoiceItem = {
  id: string;
  invoiceNumber: string;
  supplier: { name: string } | null;
  createdAt: string;
  status: string;
  totalCents: number;
  itemsCount: number;
  vatCents: number;
  discountCents: number;
  freightCents: number;
  subtotalCents: number;
};

export function createColumns(
  country: CountryCode | null,
  slug: string,
  onView?: (id: string) => void,
): ColumnDef<PurchaseInvoiceItem>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => {
        return renderComponent(InvoiceIdCell, { id: row.original.id });
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => (row.original.supplier ? row.original.supplier.name : "-"),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        return renderComponent(DateCell, { date: row.original.createdAt });
      },
    },
    {
      accessorKey: "itemsCount",
      header: "Items",
      cell: ({ row }) => {
        return String(row.original.itemsCount);
      },
    },
    {
      accessorKey: "totalCents",
      header: "Total",
      cell: ({ row }) => {
        return renderComponent(PriceCell, { cents: row.original.totalCents, country });
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return renderComponent(StatusCell, { status: row.original.status });
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return renderComponent(ActionsCell, { id: row.original.id, slug, onView });
      },
    },
  ];
}
