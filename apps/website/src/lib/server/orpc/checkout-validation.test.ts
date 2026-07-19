import { call } from "@orpc/server";
import { expect, test, vi } from "vitest";

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/orpc/base", async () => {
  const { os } = await import("@orpc/server");
  const pass = os.middleware(({ next }) => next());
  return { os, authMiddleware: pass, protectedShopMiddleware: pass };
});
vi.mock("$lib/server/db", async () => {
  const database = await import("@repo/database");
  return {
    ...database,
    db: {
      query: {
        product: {
          findMany: vi.fn(async () => [
            { id: "product-1", name: "Widget", priceCents: 100, stock: 10 },
          ]),
        },
        taxSettings: { findFirst: vi.fn(async () => ({ enabled: false, rate: 0 })) },
        inventoryMovement: { findFirst: vi.fn(async () => null) },
      },
      transaction: vi.fn(),
    },
  };
});

import { checkoutHandler } from "./handlers/products/checkout_product";

test("checkout rejects fractional quantities", async () => {
  await expect(
    call(checkoutHandler, { items: [{ productId: "product-1", qty: 0.5 }] }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

test("checkout rejects discounts above the taxed subtotal", async () => {
  await expect(
    call(checkoutHandler, {
      items: [{ productId: "product-1", qty: 1 }],
      discountCents: 101,
    }),
  ).rejects.toMatchObject({
    code: "BAD_REQUEST",
    data: { key: "error_discount_exceeds_order_amount" },
  });
});
