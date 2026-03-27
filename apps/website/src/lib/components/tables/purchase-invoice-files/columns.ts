import { renderComponent } from "@repo/ui/data-table";
import type { ColumnDef } from "@tanstack/table-core";
import ActionsCell from "./cells/ActionsCell.svelte";
import FileCell from "./cells/FileCell.svelte";
import StatusCell from "./cells/StatusCell.svelte";
import DateCell from "../purchase-invoices/cells/DateCell.svelte";

export type InvoiceFileItem = {
  id: string;
  objectPath: string;
  filename: string;
  fileType: string;
  size: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createColumns(
  slug: string,
  onProcess: (id: string) => void,
  processingFileId: string | null,
): ColumnDef<InvoiceFileItem>[] {
  return [
    {
      accessorKey: "filename",
      header: "File",
      cell: ({ row }) => {
        return renderComponent(FileCell, {
          filename: row.original.filename,
          fileType: row.original.fileType,
        });
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => formatFileSize(row.original.size),
    },
    {
      accessorKey: "createdAt",
      header: "Uploaded",
      cell: ({ row }) => {
        return renderComponent(DateCell, { date: row.original.createdAt });
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
        return renderComponent(ActionsCell, {
          id: row.original.id,
          slug,
          status: row.original.status,
          isProcessing: processingFileId === row.original.id,
          onProcess,
        });
      },
    },
  ];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
