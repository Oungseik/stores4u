import { call } from "@orpc/server";
import { expect, test, vi } from "vitest";

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/auth", () => ({
  isDashboardRole: (role: unknown) => ["owner", "admin", "member"].includes(String(role)),
}));
vi.mock("$lib/server/db", () => ({
  db: { query: { shop: { findFirst: vi.fn(async () => ({ id: "shop-id" })) } } },
  eq: vi.fn(),
  productCategory: {},
}));

import { getCategoryProductsHandler } from "./handlers/categories/get_category_products";
import { listCategoriesHandler } from "./handlers/categories/list_categories";
import { getProductHandler } from "./handlers/products/get_product";
import { listProductsHandler } from "./handlers/products/list_products";

const unauthenticatedContext = { context: {} };
const now = new Date();
const contextFor = (role: "member" | "user") => ({
  context: {
    session: {
      session: {
        id: "session-id",
        userId: "user-id",
        expiresAt: now,
        createdAt: now,
        updatedAt: now,
        token: "token",
      },
      user: {
        id: "user-id",
        email: "staff@example.com",
        emailVerified: true,
        name: "Staff",
        createdAt: now,
        updatedAt: now,
        role,
      },
    },
  },
});
const dashboardContext = contextFor("member");

type CallContext = typeof unauthenticatedContext | ReturnType<typeof contextFor>;
const catalogReads = (context: CallContext) => [
  () => call(listProductsHandler, {}, context),
  () => call(getProductHandler, { id: "product-id" }, context),
  () => call(listCategoriesHandler, {}, context),
  () => call(getCategoryProductsHandler, { categoryId: "category-id" }, context),
];

test("catalog reads reject unauthenticated calls", async () => {
  for (const request of catalogReads(unauthenticatedContext)) {
    await expect(request()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }
});

test("catalog reads reject non-dashboard users", async () => {
  for (const request of catalogReads(contextFor("user"))) {
    await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN" });
  }
});

test("catalog list page sizes are capped", async () => {
  const requests = [
    () => call(listProductsHandler, { pageSize: 101 }, dashboardContext),
    () => call(listCategoriesHandler, { pageSize: 101 }, dashboardContext),
  ];

  for (const request of requests) {
    await expect(request()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
});
