import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";

import ActionsCell from "./cells/actions-cell.svelte";
import NameCell from "./cells/name-cell.svelte";
import PriceCell from "./cells/price-cell.svelte";
import StockCell from "./cells/stock-cell.svelte";

export type ProductItem = {
  id: string;
  name: string;
  sku: string | null;
  image: string | null;
  priceCents: number;
  stock: number;
  lowStockThreshold: number | null;
  categories: string[];
};

export function createColumns(
  country: CountryCode | null,
  slug: string,
  onDelete: (id: string) => void,
): ColumnDef<ProductItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) =>
        renderComponent(NameCell, {
          id: row.original.id,
          name: row.original.name,
          image: row.original.image,
          slug,
        }),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.original.sku ?? "—",
    },
    {
      accessorKey: "priceCents",
      header: "Price",
      cell: ({ row }) => renderComponent(PriceCell, { cents: row.original.priceCents, country }),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) =>
        renderComponent(StockCell, {
          stock: row.original.stock,
          lowStockThreshold: row.original.lowStockThreshold,
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        renderComponent(ActionsCell, {
          id: row.original.id,
          onDelete,
        }),
    },
  ];
}
