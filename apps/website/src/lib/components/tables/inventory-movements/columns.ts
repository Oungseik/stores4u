import type { CountryCode } from "@repo/config";
import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";

import CostCell from "./cells/CostCell.svelte";
import DateCell from "./cells/DateCell.svelte";
import MovementTypeCell from "./cells/MovementTypeCell.svelte";
import ProductCell from "./cells/ProductCell.svelte";
import QuantityCell from "./cells/QuantityCell.svelte";
import ReasonCell from "./cells/ReasonCell.svelte";
import ReferenceCell from "./cells/ReferenceCell.svelte";

export type MovementItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productImage: string | null;
  productUom: string | null;
  movementType: "PURCHASE" | "SALE" | "RETURN" | "WASTAGE" | "ADJUSTMENT" | "CORRECTION";
  qty: number;
  unitCostCents: number | null;
  unitPriceCents: number | null;
  reason: string | null;
  occurredAt: Date;
  referenceType: string | null;
  referenceId: string | null;
  purchaseInvoiceNumber: string | null;
};

export function createColumns(country: CountryCode | null): ColumnDef<MovementItem>[] {
  return [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => {
        return renderComponent(ProductCell, {
          name: row.original.productName,
          sku: row.original.productSku,
        });
      },
    },
    {
      accessorKey: "movementType",
      header: "Type",
      cell: ({ row }) => {
        return renderComponent(MovementTypeCell, { movementType: row.original.movementType });
      },
    },
    {
      accessorKey: "qty",
      header: "Quantity",
      cell: ({ row }) => {
        return renderComponent(QuantityCell, { qty: row.original.qty });
      },
    },
    {
      accessorKey: "unitCostCents",
      header: "Unit Cost",
      cell: ({ row }) => {
        return renderComponent(CostCell, {
          cents: row.original.unitCostCents,
          country,
        });
      },
    },
    {
      accessorKey: "unitPriceCents",
      header: "Unit Price",
      cell: ({ row }) => {
        return renderComponent(CostCell, {
          cents: row.original.unitPriceCents,
          country,
        });
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        return renderComponent(ReasonCell, { reason: row.original.reason });
      },
    },
    {
      accessorKey: "occurredAt",
      header: "Occurred At",
      cell: ({ row }) => {
        return renderComponent(DateCell, { date: row.original.occurredAt });
      },
    },
    {
      accessorKey: "referenceId",
      header: "Reference",
      cell: ({ row }) => {
        return renderComponent(ReferenceCell, {
          referenceType: row.original.referenceType,
          referenceId: row.original.referenceId,
          purchaseInvoiceNumber: row.original.purchaseInvoiceNumber,
        });
      },
    },
  ];
}
