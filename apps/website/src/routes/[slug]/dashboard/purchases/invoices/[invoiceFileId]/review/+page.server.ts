import { error, redirect } from "@sveltejs/kit";
import { getShopDb } from "$lib/server/shop_db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { slug } = await parent();
  const shopDb = getShopDb({ slug });

  const file = await shopDb.query.purchaseInvoiceFile.findFirst({
    where: { id: params.invoiceFileId },
    columns: { status: true },
  });

  if (!file) {
    throw error(404, "Invoice file not found");
  }

  if (file.status === "REVIEWED") {
    return redirect(303, `/${params.slug}/dashboard/purchases/invoices/${params.invoiceFileId}`);
  }
};
