import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";

import ActionsCell from "./cells/ActionsCell.svelte";
import LastCostCell from "./cells/LastCostCell.svelte";
import NameCell from "./cells/NameCell.svelte";
import PriceCell from "./cells/PriceCell.svelte";
import StockCell from "./cells/StockCell.svelte";

export type ProductItem = {
  id: string;
  name: string;
  sku: string | null;
  priceCents: number;
  lastCostCents: number | null;
  stock: number;
  lowStockThreshold: number | null;
};

export function createColumns(
  country: CountryCode | null,
  slug: string,
  onDelete?: (id: string) => void,
  onAdjustStock?: (id: string, name: string, stock: number) => void,
  onEdit?: (id: string) => void,
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
      accessorKey: "priceCents",
      header: "Price",
      cell: ({ row }) => {
        return renderComponent(PriceCell, { cents: row.original.priceCents, country });
      },
    },
    {
      accessorKey: "lastCostCents",
      header: "Last Cost",
      cell: ({ row }) => {
        return renderComponent(LastCostCell, {
          lastCostCents: row.original.lastCostCents,
          priceCents: row.original.priceCents,
          country,
        });
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        return renderComponent(StockCell, {
          stock: row.original.stock,
          lowStockThreshold: row.original.lowStockThreshold,
        });
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return renderComponent(ActionsCell, {
          id: row.original.id,
          slug,
          productName: row.original.name,
          currentStock: row.original.stock,
          onDelete,
          onAdjustStock,
          onEdit,
        });
      },
    },
  ];
}
