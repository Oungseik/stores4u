import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";

import ActionsCell from "./cells/ActionsCell.svelte";
import NameCell from "./cells/NameCell.svelte";
import PriceCell from "./cells/PriceCell.svelte";
import StockCell from "./cells/StockCell.svelte";

export type ProductItem = {
  id: string;
  name: string;
  sku: string | null;
  categories: string[];
  priceCents: number;
  stock: number;
};

export function createColumns(
  country: CountryCode | null,
  slug: string,
  onDelete?: (id: string) => void,
): ColumnDef<ProductItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        return renderComponent(NameCell, { name: row.original.name });
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => {
        return row.original.sku ?? "—";
      },
    },
    {
      accessorKey: "categories",
      header: "Category",
      cell: ({ row }) => {
        return row.original.categories.length > 0 ? row.original.categories[0] : "—";
      },
    },
    {
      accessorKey: "priceCents",
      header: "Price",
      cell: ({ row }) => {
        return renderComponent(PriceCell, { cents: row.original.priceCents, country });
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        return renderComponent(StockCell, { stock: row.original.stock });
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return renderComponent(ActionsCell, { id: row.original.id, slug, onDelete });
      },
    },
  ];
}
