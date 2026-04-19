import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  authMiddleware,
  os,
  protectedShopMiddleware,
  shopDbMiddleware,
} from "$lib/server/orpc/base";
import { extractObjectKey, presignDownload } from "$lib/server/storage";

const input = z.object({
  slug: z.string().min(1).max(100),
  invoiceFileId: z.string().min(1),
});

export const getInvoiceHandler = os
  .route({ method: "GET" })
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .use(shopDbMiddleware)
  .handler(async ({ input, context: { shopDb } }) => {
    const invoice = await shopDb.query.purchaseInvoice.findFirst({
      where: { invoiceFileId: input.invoiceFileId },
      with: {
        supplier: {
          columns: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            phone2: true,
            email: true,
            address: true,
          },
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                sku: true,
                image: true,
                uom: true,
              },
            },
          },
        },
        invoiceFile: {
          columns: {
            id: true,
            objectPath: true,
            filename: true,
            fileType: true,
            status: true,
            createdAt: true,
          },
        },
        ocrResult: {
          columns: {
            id: true,
            confidenceScore: true,
            extractedData: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new ORPCError("NOT_FOUND", { message: "Invoice not found" });
    }

    const objectKey = invoice.invoiceFile ? extractObjectKey(invoice.invoiceFile.objectPath) : null;
    const imageUrl = objectKey ? presignDownload(objectKey, 3600) : null;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      subtotalCents: invoice.subtotalCents,
      vatCents: invoice.vatCents,
      discountCents: invoice.discountCents,
      freightCents: invoice.freightCents,
      totalCents: invoice.totalCents,
      status: invoice.status,
      notes: invoice.notes,
      validatedAt: invoice.validatedAt,
      createdAt: invoice.createdAt,
      supplier: invoice.supplier,
      items: invoice.items.map((item) => ({
        id: item.id,
        invoiceItemName: item.invoiceItemName,
        qty: item.qty,
        unitCostCents: item.unitCostCents,
        lineSubtotalCents: item.lineSubtotalCents,
        lineTotalCents: item.lineTotalCents,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              image: item.product.image,
              uom: item.product.uom,
            }
          : null,
      })),
      file: invoice.invoiceFile
        ? {
            ...invoice.invoiceFile,
            imageUrl,
          }
        : null,
      ocrResult: invoice.ocrResult,
    };
  });
