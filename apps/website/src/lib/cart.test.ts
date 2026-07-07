import { beforeEach, expect, test } from "vitest";

import { cart } from "./cart.svelte";

beforeEach(() => {
  cart.clear();
});

const product = {
  id: "p1",
  barcode: "111",
  name: "Widget",
  priceCents: 500,
  image: null,
};

test("add inserts a new item at quantity 1", () => {
  cart.add(product);
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(1);
});

test("add of an existing product increments quantity instead of duplicating", () => {
  cart.add(product);
  cart.add(product);
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(2);
});

test("bump increases and decreases quantity", () => {
  cart.add(product);
  cart.bump("p1", 2);
  expect(cart.items[0].quantity).toBe(3);
  cart.bump("p1", -1);
  expect(cart.items[0].quantity).toBe(2);
});

test("bump removes the item when quantity reaches zero", () => {
  cart.add(product);
  cart.bump("p1", -1);
  expect(cart.items).toHaveLength(0);
});

test("remove drops the item by id", () => {
  cart.add(product);
  cart.remove("p1");
  expect(cart.items).toHaveLength(0);
});

test("totals reflect quantity and price across items", () => {
  cart.add(product);
  cart.add({ ...product, id: "p2", priceCents: 1000 });
  cart.bump("p2", 1); // p2 qty 2
  expect(cart.totalItems).toBe(3);
  expect(cart.totalCents).toBe(500 * 1 + 1000 * 2);
});

test("clear empties the cart", () => {
  cart.add(product);
  cart.clear();
  expect(cart.items).toHaveLength(0);
  expect(cart.totalCents).toBe(0);
});
