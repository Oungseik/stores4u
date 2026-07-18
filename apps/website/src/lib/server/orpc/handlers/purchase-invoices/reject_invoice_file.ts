import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, eq, purchaseInvoiceFile } from "$lib/server/db";
import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  invoiceFileId: z.string().min(1),
});

export const rejectInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const now = new Date();

    const file = await db.query.purchaseInvoiceFile.findFirst({
      where: { id: input.invoiceFileId },
    });

    if (!file) {
      throw new ORPCError("NOT_FOUND", { data: { key: "error_invoice_file_not_found" } });
    }

    if (file.status !== "PROCESSED") {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "error_only_processed_invoice_files_can_be_rejected" },
      });
    }

    await db
      .update(purchaseInvoiceFile)
      .set({ status: "REJECTED", updatedAt: now })
      .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));

    return { success: true };
  });
