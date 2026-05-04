import { ORPCError } from "@orpc/server";
import { eq, purchaseInvoiceFile } from "@repo/perstore-db";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";

const input = z.object({
  slug: z.string().min(1).max(100),
  invoiceFileId: z.string().min(1),
});

export const rejectInvoiceFileHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const now = new Date();

    const file = await shopDb.query.purchaseInvoiceFile.findFirst({
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

    await shopDb
      .update(purchaseInvoiceFile)
      .set({ status: "REJECTED", updatedAt: now })
      .where(eq(purchaseInvoiceFile.id, input.invoiceFileId));

    return { success: true };
  });
