import { error, redirect } from "@sveltejs/kit";
import { getShopDb } from "$lib/server/shop_db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { slug } = await parent();
  const shopDb = await getShopDb({ slug });

  const invoiceFile = await shopDb.query.purchaseInvoiceFile.findFirst({
    where: { id: params.invoiceFileId },
    columns: { status: true },
  });

  if (!invoiceFile) {
    throw error(404, "Invoice file not found");
  }

  if (invoiceFile.status !== "REVIEWED") {
    throw error(400, "This invoice cannot be edited in its current status");
  }

  const invoice = await shopDb.query.purchaseInvoice.findFirst({
    where: { invoiceFileId: params.invoiceFileId },
    with: {
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
    },
  });

  if (!invoice) {
    throw error(404, "Invoice not found");
  }

  return { invoice };
};
