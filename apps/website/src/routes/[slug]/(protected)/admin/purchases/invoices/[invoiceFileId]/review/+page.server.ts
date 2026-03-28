import { error } from "@sveltejs/kit";
import { getShopDb } from "$lib/server/shop_db";
import { extractObjectKey, presignDownload } from "$lib/server/storage";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const shopDb = getShopDb({ slug: params.slug });

  const file = await shopDb.query.purchaseInvoiceFile.findFirst({
    where: { id: params.invoiceFileId },
    with: { ocrResult: true },
  });

  if (!file) {
    error(404, { message: "Invoice file not found" });
  }

  if (file.status !== "PROCESSED") {
    error(400, { message: "Invoice file must be processed before review" });
  }

  const suppliers = await shopDb.query.supplier.findMany({
    orderBy: { name: "asc" },
  });

  let matchedSupplier = null;
  let extractedData = null;

  if (file.ocrResult?.extractedData) {
    try {
      extractedData = JSON.parse(file.ocrResult.extractedData);
      if (extractedData.matchedSupplierId) {
        matchedSupplier = await shopDb.query.supplier.findFirst({
          where: { id: extractedData.matchedSupplierId },
        });
      }
    } catch {
      extractedData = null;
    }
  }

  const objectKey = extractObjectKey(file.objectPath);
  const imageUrl = objectKey ? presignDownload(objectKey, 3600) : null;

  return {
    file: {
      id: file.id,
      filename: file.filename,
      fileType: file.fileType,
      status: file.status,
      objectPath: file.objectPath,
    },
    ocrResult: file.ocrResult
      ? {
          id: file.ocrResult.id,
          rawJson: file.ocrResult.rawJson,
          extractedData: file.ocrResult.extractedData,
          confidenceScore: file.ocrResult.confidenceScore,
        }
      : null,
    extractedData,
    matchedSupplier: matchedSupplier
      ? {
          id: matchedSupplier.id,
          name: matchedSupplier.name,
          contactName: matchedSupplier.contactName,
          phone: matchedSupplier.phone,
          email: matchedSupplier.email,
          address: matchedSupplier.address,
        }
      : null,
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      address: s.address,
    })),
    imageUrl,
  };
}
