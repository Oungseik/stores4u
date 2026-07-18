import * as msg from "$lib/paraglide/messages";
import type { CurrencyCode } from "@repo/config";
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
  currency: CurrencyCode,
  onDelete?: (id: string) => void,
  onAdjustStock?: (id: string, name: string, stock: number, lastCostCents: number | null) => void,
): ColumnDef<ProductItem>[] {
  return [
    {
      accessorKey: "name",
      header: msg.ui_name(),
      cell: ({ row }) => {
        return renderComponent(NameCell, { name: row.original.name });
      },
    },
    {
      accessorKey: "sku",
      header: msg.ui_sku(),
      cell: ({ row }) => {
        return row.original.sku ?? "—";
      },
    },
    {
      accessorKey: "priceCents",
      header: msg.ui_price(),
      cell: ({ row }) => {
        return renderComponent(PriceCell, { cents: row.original.priceCents, currency });
      },
    },
    {
      accessorKey: "lastCostCents",
      header: "Last Cost",
      cell: ({ row }) => {
        return renderComponent(LastCostCell, {
          lastCostCents: row.original.lastCostCents,
          priceCents: row.original.priceCents,
          currency,
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
          productName: row.original.name,
          currentStock: row.original.stock,
          lastCostCents: row.original.lastCostCents,
          onDelete,
          onAdjustStock,
        });
      },
    },
  ];
}
