import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";
import ActionsCell from "./cells/ActionsCell.svelte";
import DateCell from "./cells/DateCell.svelte";
import InvoiceIdCell from "./cells/InvoiceIdCell.svelte";
import PriceCell from "./cells/PriceCell.svelte";
import StatusCell from "./cells/StatusCell.svelte";

export type PurchaseInvoiceItem = {
  id: string;
  supplier: string;
  date: string;
  status: string;
  totalCents: number;
  items: number;
  vatCents: number;
  discountCents: number;
  freightCents: number;
  subtotalCents: number;
};

export function createColumns(
  country: CountryCode | null,
  onView?: (id: string) => void,
): ColumnDef<PurchaseInvoiceItem>[] {
  return [
    {
      accessorKey: "id",
      header: "Invoice",
      cell: ({ row }) => {
        return renderComponent(InvoiceIdCell, { id: row.original.id });
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        return renderComponent(DateCell, { date: row.original.date });
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        return String(row.original.items);
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
        return renderComponent(ActionsCell, { id: row.original.id, onView });
      },
    },
  ];
}
