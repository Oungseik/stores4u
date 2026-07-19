import { call } from "@orpc/server";
import { unlink } from "node:fs/promises";
import { afterAll, beforeEach, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({ url: `file:/tmp/stores4u-stock-${process.pid}.db` }));

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/orpc/base", async () => {
  const { os } = await import("@orpc/server");
  return { os, protectedShopMiddleware: os.middleware(({ next }) => next()) };
});
vi.mock("$lib/server/db", async () => {
  const { createClient } = await import("@libsql/client");
  const database = await import("@repo/database");
  const client = createClient({ url: state.url });
  const db = database.createDb(client);
  const transaction = async (callback: Parameters<typeof db.transaction>[0]) => {
    const transactionClient = createClient({ url: state.url });
    await transactionClient.execute("PRAGMA busy_timeout = 100");
    try {
      return await database.createDb(transactionClient).transaction(callback);
    } finally {
      transactionClient.close();
    }
  };
  return {
    ...database,
    client,
    db: new Proxy(db, {
      get: (target, property) =>
        property === "transaction" ? transaction : Reflect.get(target, property, target),
    }),
  };
});

import { client } from "$lib/server/db";
import { adjustStockHandler } from "./handlers/inventory/adjust_stock";

await client.executeMultiple(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 100;
  PRAGMA foreign_keys = ON;
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

beforeEach(async () => {
  await client.executeMultiple("DELETE FROM inventory_movement; DELETE FROM product;");
  await client.execute({
    sql: "INSERT INTO product (id, name, stock, updated_at) VALUES (?, ?, ?, ?)",
    args: ["product-1", "Widget", 5, Date.now()],
  });
});

afterAll(async () => {
  client.close();
  await unlink(new URL(state.url)).catch(() => undefined);
});

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
  expect(
    (await client.execute("SELECT stock FROM product WHERE id = 'product-1'")).rows[0],
  ).toEqual({
    stock: 0,
  });
  expect(
    (await client.execute("SELECT COUNT(*) AS count FROM inventory_movement")).rows[0],
  ).toEqual({
    count: 1,
  });
});
