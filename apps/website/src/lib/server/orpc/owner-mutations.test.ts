import { call } from "@orpc/server";
import { expect, test, vi } from "vitest";

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/auth", () => ({
  isDashboardRole: (role: unknown) => ["owner", "admin", "member"].includes(String(role)),
}));
const dbMocks = vi.hoisted(() => ({
  findShop: vi.fn(),
  insert: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  where: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));
vi.mock("$lib/server/db", () => ({
  db: {
    query: { shop: { findFirst: dbMocks.findShop } },
    insert: dbMocks.insert,
    update: dbMocks.update,
  },
  invoiceSettings: {},
  shop: {},
  shopInfo: {},
  taxSettings: {},
}));
vi.mock("$lib/server/storage", () => ({ extractObjectKey: vi.fn(), removeImage: vi.fn() }));

import { updateInvoiceSettingsHandler } from "./handlers/invoice/update_invoice_settings";
import { updateShopHandler } from "./handlers/shops/update_shop";
import { updateTaxSettingsHandler } from "./handlers/tax/update_tax_settings";

const inputs = {
  invoice: {
    paperWidth: "80" as const,
    showLogo: true,
    showAddress: true,
    showState: true,
    showCountry: true,
    showPhone: true,
    showEmail: true,
    footerText: "Thanks",
  },
  shop: {
    address: "1 Main St",
    city: "Yangon",
    phone: "123456",
    state: "Yangon",
    zipCode: "11181",
    email: "store@example.com",
    country: "MM" as const,
    currency: "MMK" as const,
    timezone: "Asia/Yangon",
  },
  tax: { enabled: true, name: "Tax", rate: 5 },
};

const contextFor = (role: "owner" | "admin" | "member") => {
  const now = new Date();
  return {
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
  };
};

for (const role of ["admin", "member"] as const) {
  test(`owner-only mutations reject direct ${role} calls`, async () => {
    const context = contextFor(role);
    const calls = [
      () => call(updateShopHandler, inputs.shop, { context }),
      () => call(updateInvoiceSettingsHandler, inputs.invoice, { context }),
      () => call(updateTaxSettingsHandler, inputs.tax, { context }),
    ];

    for (const request of calls) {
      await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });
}

test("shop profile updates preserve omitted business fields", async () => {
  dbMocks.findShop.mockResolvedValue({
    id: "shop-id",
    logo: null,
    shopInfoId: "shop-info-id",
    shopInfo: { heroImage: null },
  });
  dbMocks.where.mockResolvedValue(undefined);
  dbMocks.set.mockReturnValue({ where: dbMocks.where });
  dbMocks.update.mockReturnValue({ set: dbMocks.set });

  await call(
    updateShopHandler,
    { name: "New name", title: "New title", description: "New description" },
    { context: contextFor("owner") },
  );

  expect(dbMocks.set).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ name: "New name", timezone: undefined }),
  );
  expect(dbMocks.set).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      title: "New title",
      description: "New description",
      address: undefined,
    }),
  );
});
