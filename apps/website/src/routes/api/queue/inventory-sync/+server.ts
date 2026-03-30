import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { and, eq, inArray, inventoryMovement, product, purchaseInvoice, sql } from "@repo/db";
import { z } from "zod";
import { qstashReceiver } from "$lib/server/qstash";
import { getShopDb } from "$lib/server/shop_db";

const payloadSchema = z.object({
  invoiceId: z.string().min(1),
  shopSlug: z.string().min(1),
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

  const parsed = payloadSchema.safeParse(JSON.parse(body));
  if (!parsed.success) {
    return json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { invoiceId, shopSlug } = parsed.data;
  const shopDb = getShopDb({ slug: shopSlug });

  const invoice = await shopDb.query.purchaseInvoice.findFirst({
    where: { id: invoiceId },
    with: { items: true },
  });

  if (!invoice) {
    return json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status !== "INVENTORY_PENDING") {
    return json({ message: "Already processed", status: invoice.status });
  }

  const [existingMovement] = await shopDb
    .select({ id: inventoryMovement.id })
    .from(inventoryMovement)
    .where(
      and(
        eq(inventoryMovement.referenceType, "INVOICE"),
        eq(inventoryMovement.referenceId, invoiceId),
      ),
    )
    .limit(1);

  if (existingMovement) {
    await shopDb
      .update(purchaseInvoice)
      .set({ status: "VALIDATED", updatedAt: new Date() })
      .where(eq(purchaseInvoice.id, invoiceId));
    return json({ message: "Already processed, status corrected" });
  }

  const productIds = invoice.items.map((item) => item.productId);
  const uniqueProductIds = [...new Set(productIds)];

  const products = await shopDb.query.product.findMany({
    where: { id: { in: uniqueProductIds } },
    columns: { id: true },
  });

  const productIdsSet = new Set(products.map((p) => p.id));
  const missingProductIds = uniqueProductIds.filter((id) => !productIdsSet.has(id));
  if (missingProductIds.length > 0) {
    return json({ error: "Products not found", missingProductIds }, { status: 500 });
  }

  const occurredAt = new Date(invoice.invoiceDate);
  const now = new Date();

  await shopDb.transaction(async (tx) => {
    await tx.insert(inventoryMovement).values(
      invoice.items.map((item) => ({
        productId: item.productId,
        purchaseInvoiceItemId: item.id,
        movementType: "PURCHASE" as const,
        qty: item.qty,
        unitCostCents: item.unitCostCents,
        referenceType: "INVOICE",
        referenceId: invoiceId,
        occurredAt,
        createdAt: now,
      })),
    );

    const productCases = sql.join(
      invoice.items.map(
        (item) => sql`when ${product.id} = ${item.productId} then ${product.stock} + ${item.qty}`,
      ),
      sql.raw(" "),
    );

    await tx
      .update(product)
      .set({
        stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
        updatedAt: now,
      })
      .where(inArray(product.id, uniqueProductIds));

    await tx
      .update(purchaseInvoice)
      .set({ status: "VALIDATED", updatedAt: now })
      .where(eq(purchaseInvoice.id, invoiceId));
  });

  return json({ message: "Inventory synced", invoiceId });
};
