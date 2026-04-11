import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";

import ActionsCell from "./cells/ActionsCell.svelte";
import DescriptionCell from "./cells/DescriptionCell.svelte";
import NameCell from "./cells/NameCell.svelte";
import ProductCountCell from "./cells/ProductCountCell.svelte";

export type CategoryItem = {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
};

export function createColumns(
  slug: string,
  onEdit: (category: CategoryItem) => void,
  onDelete: (category: CategoryItem) => void,
  onManageProducts: (category: CategoryItem) => void,
): ColumnDef<CategoryItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        return renderComponent(NameCell, { name: row.original.name });
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        return renderComponent(DescriptionCell, { description: row.original.description });
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => {
        return renderComponent(ProductCountCell, { count: row.original.productCount });
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return renderComponent(ActionsCell, {
          category: row.original,
          slug,
          onEdit,
          onDelete,
          onManageProducts,
        });
      },
    },
  ];
}
