import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  and,
  db,
  gte,
  inArray,
  inventoryMovement,
  order,
  orderItem,
  product,
  sql,
} from "$lib/server/db";

import { authMiddleware, os, protectedShopMiddleware } from "$lib/server/orpc/base";

const checkoutItem = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive(),
});

const input = z.object({
  items: z.array(checkoutItem).min(1),
  customerId: z.string().min(1).optional(),
  customerName: z.string().max(255).optional(),
  customerPhone: z.string().max(50).optional(),
  discountCents: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

export const checkoutHandler = os
  .input(input)
  .use(authMiddleware)
  .use(protectedShopMiddleware)
  .handler(async ({ input }) => {
    const now = new Date();

    const requestedQtyByProduct = input.items.reduce((qtyMap, item) => {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
      return qtyMap;
    }, new Map<string, number>());
    const productIds = [...requestedQtyByProduct.keys()];

    const [products, taxConfig] = await Promise.all([
      db.query.product.findMany({ where: { id: { in: productIds }, isArchived: false } }),
      db.query.taxSettings.findFirst(),
    ]);

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ORPCError("NOT_FOUND", {
        data: { key: "error_products_not_found", values: { products: missingIds.join(", ") } },
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const getProduct = (id: string) => {
      const p = productMap.get(id);
      if (!p) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          data: { key: "error_product_id_not_found", values: { id } },
        });
      }
      return p;
    };

    const subtotalCents = input.items.reduce((sum, item) => {
      const dbProduct = getProduct(item.productId);
      return sum + dbProduct.priceCents * item.qty;
    }, 0);

    let vatCents = 0;
    if (taxConfig?.enabled) {
      vatCents = Math.round(subtotalCents * (taxConfig.rate / 100));
    }

    const totalCents = subtotalCents - input.discountCents + vatCents;
    if (totalCents < 0) {
      throw new ORPCError("BAD_REQUEST", {
        data: { key: "error_discount_exceeds_order_amount" },
      });
    }

    // Resolve customer: when a customerId is supplied, validate it exists and
    // snapshot name/phone from the customer row onto the order (overrides any
    // caller-supplied values). Walk-in = customerId null, optional name/phone.
    let customerId: string | null = null;
    let customerName: string | null = input.customerName ?? null;
    let customerPhone: string | null = input.customerPhone ?? null;
    if (input.customerId) {
      const found = await db.query.customer.findFirst({
        where: { id: input.customerId },
      });
      if (!found) {
        throw new ORPCError("NOT_FOUND", { data: { key: "error_customer_not_found" } });
      }
      customerId = found.id;
      customerName = found.name;
      customerPhone = found.phone;
    }

    const latestCostByProduct = new Map(
      await Promise.all(
        productIds.map(async (pid) => {
          const row = await db.query.inventoryMovement.findFirst({
            where: { productId: pid, movementType: { in: ["ADJUSTMENT", "PURCHASE"] } },
            orderBy: { createdAt: "desc" },
          });
          return [pid, row?.unitCostCents ?? 0] as const;
        }),
      ),
    );

    const result = db.transaction((tx) => {
      const orderRecord = tx
        .insert(order)
        .values({
          customerId,
          customerName,
          customerPhone,
          subtotalCents,
          discountCents: input.discountCents,
          vatCents,
          totalCents,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: order.id })
        .all();
      const createdOrder = orderRecord[0];

      if (!createdOrder) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          data: { key: "error_failed_to_create_order" },
        });
      }

      const orderItems = input.items.map((item) => {
        const unitPriceCents = getProduct(item.productId).priceCents;
        return {
          id: Bun.randomUUIDv7(),
          orderId: createdOrder.id,
          productId: item.productId,
          qty: item.qty,
          unitPriceCents,
          lineTotalCents: unitPriceCents * item.qty,
          createdAt: now,
        };
      });

      tx.insert(orderItem).values(orderItems).run();

      const productCases = sql.join(
        [...requestedQtyByProduct.entries()].map(
          ([productId, soldQty]) => sql`when ${productId} then ${product.stock} - ${soldQty}`,
        ),
        sql.raw(" "),
      );

      const updateResult = tx
        .update(product)
        .set({
          stock: sql`case ${product.id} ${productCases} else ${product.stock} end`,
          updatedAt: now,
        })
        .where(
          and(
            inArray(product.id, productIds),
            gte(
              product.stock,
              sql`CASE ${sql.join(
                [...requestedQtyByProduct.entries()].map(
                  ([productId, soldQty]) => sql`when ${product.id} = ${productId} then ${soldQty}`,
                ),
                sql.raw(" "),
              )} else 0 END`,
            ),
          ),
        )
        .run() as unknown as { changes: number };

      if (updateResult.changes !== productIds.length) {
        const insufficient = [...requestedQtyByProduct.entries()]
          .filter(([id, requested]) => getProduct(id).stock < requested)
          .map(([id, requested]) => {
            const p = getProduct(id);
            return `"${p.name}" (available: ${getProduct(id).stock}, requested: ${requested})`;
          });

        throw new ORPCError("BAD_REQUEST", {
          data: {
            key: "error_insufficient_stock_products",
            values: { products: insufficient.join(", ") },
          },
        });
      }

      tx.insert(inventoryMovement)
        .values(
          input.items.map((item) => ({
            productId: item.productId,
            movementType: "SALE" as const,
            qty: -item.qty,
            unitCostCents: latestCostByProduct.get(item.productId) ?? 0,
            unitPriceCents: getProduct(item.productId).priceCents,
            referenceType: "ORDER" as const,
            referenceId: createdOrder.id,
            occurredAt: now,
            createdAt: now,
          })),
        )
        .run();

      return {
        orderId: createdOrder.id,
        subtotalCents,
        discountCents: input.discountCents,
        vatCents,
        totalCents,
        itemCount: input.items.reduce((sum, item) => sum + item.qty, 0),
      };
    });

    return result;
  });
