import { call } from "@orpc/server";
import { afterAll, beforeEach, expect, test, vi } from "vitest";

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/orpc/base", async () => {
  const { os } = await import("@orpc/server");
  return { os, protectedShopMiddleware: os.middleware(({ next }) => next()) };
});
vi.mock("$lib/server/db", async () => {
  const { Database } = await import("bun:sqlite");
  const database = await import("@repo/database");
  const client = new Database(":memory:");
  return { ...database, client, db: database.createDb(client) };
});

import { client } from "$lib/server/db";
import { adjustStockHandler } from "./handlers/inventory/adjust_stock";

client.exec(`
  CREATE TABLE product (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE inventory_movement (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES product(id),
    purchase_invoice_item_id TEXT,
    movement_type TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_cost_cents INTEGER,
    unit_price_cents INTEGER,
    reference_type TEXT NOT NULL,
    reference_id TEXT,
    reason TEXT,
    occurred_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

beforeEach(() => {
  client.exec("DELETE FROM inventory_movement; DELETE FROM product;");
  client
    .query("INSERT INTO product (id, name, stock, updated_at) VALUES (?, ?, ?, ?)")
    .run("product-1", "Widget", 5, Date.now());
});

afterAll(() => client.close());

test("concurrent stock subtractions cannot oversell or record a failed movement", async () => {
  const subtraction = {
    productId: "product-1",
    direction: "SUBTRACT" as const,
    movementType: "WASTAGE" as const,
    qty: 5,
    unitCostCents: 100,
    date: new Date().toISOString(),
  };

  const results = await Promise.allSettled([
    call(adjustStockHandler, subtraction),
    call(adjustStockHandler, subtraction),
  ]);

  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({
    reason: { code: "BAD_REQUEST", data: { key: "error_insufficient_stock" } },
  });
  expect(client.query("SELECT stock FROM product WHERE id = ?").get("product-1")).toEqual({
    stock: 0,
  });
  expect(client.query("SELECT COUNT(*) AS count FROM inventory_movement").get()).toEqual({
    count: 1,
  });
});
