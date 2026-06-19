import { error, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const file = await db.query.purchaseInvoiceFile.findFirst({
    where: { id: params.invoiceFileId },
    columns: { status: true },
  });

  if (!file) {
    throw error(404, "Invoice file not found");
  }

  if (file.status === "REVIEWED") {
    return redirect(303, `/purchases/invoices/${params.invoiceFileId}`);
  }
};
