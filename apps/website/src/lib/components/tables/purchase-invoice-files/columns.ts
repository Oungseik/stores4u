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
  confidenceScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function createColumns(
  slug: string,
  onProcess: (id: string) => void,
  processingFileId: string | null,
  onDelete: (id: string) => void,
  onDownload: (id: string) => void,
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
      accessorKey: "confidenceScore",
      header: "Confidence",
      cell: ({ row }) => {
        const status = row.original.status;
        const score = row.original.confidenceScore;
        if ((status === "PROCESSED" || status === "REVIEWED") && score !== null) {
          return `${Math.round(score * 100)}%`;
        }
        return "-";
      },
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
          onDelete,
          onDownload,
        });
      },
    },
  ];
}
