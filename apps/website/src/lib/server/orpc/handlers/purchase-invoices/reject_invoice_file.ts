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
      throw new ORPCError("NOT_FOUND", { message: "Invoice file not found" });
    }

    if (file.status !== "PROCESSED") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Only processed invoice files can be rejected",
      });
    }

    await db
      .update(purchaseInvoiceFile)
      .set({ status: "REJECTED", updatedAt: now })
      .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));

    return { success: true };
  });
