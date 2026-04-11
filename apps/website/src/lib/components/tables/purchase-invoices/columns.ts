import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";
import DateCell from "./cells/DateCell.svelte";
import InvoiceIdCell from "./cells/InvoiceNumberCell.svelte";
import PriceCell from "./cells/PriceCell.svelte";
import StatusCell from "./cells/StatusCell.svelte";

export type PurchaseInvoiceItem = {
  id: string;
  invoiceNumber: string;
  invoiceFileId: string | null;
  supplier: { name: string } | null;
  createdAt: Date;
  status: string;
  totalCents: number;
  itemsCount: number;
  vatCents: number;
  discountCents: number;
  freightCents: number;
  subtotalCents: number;
};

export function createColumns(country: CountryCode | null): ColumnDef<PurchaseInvoiceItem>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => {
        return renderComponent(InvoiceIdCell, { id: row.original.invoiceNumber });
      },
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
  ];
}
