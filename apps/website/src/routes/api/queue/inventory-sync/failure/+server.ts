import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { eq, purchaseInvoice } from "@repo/db";
import { z } from "zod";
import { qstashReceiver } from "$lib/server/qstash";
import { getShopDb } from "$lib/server/shop_db";

const payloadSchema = z.object({
  invoiceId: z.string().min(1),
  shopSlug: z.string().min(1),
});

const failureBodySchema = z.object({
  error: z.string(),
  message: z.string(),
  body: z.string(),
});

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await request.text();
  const isValid = await qstashReceiver.verify({
    signature,
    body,
    url: request.url,
  });

  if (!isValid) {
    return json({ error: "Invalid signature" }, { status: 401 });
  }

  const failureBody = failureBodySchema.safeParse(JSON.parse(body));
  if (!failureBody.success) {
    return json({ error: "Invalid failure payload" }, { status: 400 });
  }

  const originalBody = payloadSchema.safeParse(JSON.parse(failureBody.data.body));
  if (!originalBody.success) {
    return json({ error: "Invalid original payload" }, { status: 400 });
  }

  const { invoiceId, shopSlug } = originalBody.data;
  const shopDb = getShopDb({ slug: shopSlug });

  const invoice = await shopDb.query.purchaseInvoice.findFirst({
    where: { id: invoiceId },
    columns: { id: true, status: true },
  });

  if (!invoice) {
    return json({ message: "Invoice not found" });
  }

  if (invoice.status !== "INVENTORY_PENDING") {
    return json({ message: "Invoice not in INVENTORY_PENDING state", status: invoice.status });
  }

  await shopDb
    .update(purchaseInvoice)
    .set({ status: "INVENTORY_FAILED", updatedAt: new Date() })
    .where(eq(purchaseInvoice.id, invoiceId));

  return json({ message: "Invoice marked as INVENTORY_FAILED", invoiceId });
};
