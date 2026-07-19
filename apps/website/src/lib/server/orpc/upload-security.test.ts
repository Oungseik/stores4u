import { call } from "@orpc/server";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  putObject: vi.fn(),
  values: vi.fn(async () => ({ changes: 1 })),
}));

vi.mock("zod", async (importOriginal) => {
  const z = await importOriginal<typeof import("zod")>();
  return { ...z, z };
});
vi.mock("$lib/server/auth", () => ({
  isDashboardRole: (role: unknown) => ["owner", "admin", "member"].includes(String(role)),
}));
vi.mock("$lib/server/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: mocks.values })),
    query: { shop: { findFirst: vi.fn(async () => ({ id: "shop-id", shopInfo: null })) } },
  },
  image: {},
  purchaseInvoiceFile: {},
}));
vi.mock("$lib/server/storage", () => ({
  getObjectUrl: (key: string) => `/storage/${key}`,
  putObject: mocks.putObject,
}));

import { uploadHandler } from "./handlers/images/upload";
import { uploadInvoiceFileHandler } from "./handlers/purchase-invoices/upload_invoice_file";

const now = new Date();
const context = {
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
      role: "member",
    },
  },
};

beforeEach(() => vi.clearAllMocks());

test("invoice upload rejects HTML disguised as a PDF", async () => {
  const file = new File(["<!doctype html><script>alert(document.domain)</script>"], "invoice.pdf", {
    type: "application/pdf",
  });

  await expect(call(uploadInvoiceFileHandler, { file }, { context })).rejects.toMatchObject({
    code: "BAD_REQUEST",
  });
  expect(mocks.putObject).not.toHaveBeenCalled();
});

test("invoice upload uses detected type and a canonical extension", async () => {
  const file = new File(["%PDF-1.7\n"], "invoice.html", { type: "text/html" });

  await expect(call(uploadInvoiceFileHandler, { file }, { context })).resolves.toEqual({
    success: true,
  });
  expect(mocks.putObject).toHaveBeenCalledWith(
    expect.stringMatching(/^invoice-files\/.+\.pdf$/),
    expect.any(Buffer),
  );
  expect(mocks.values).toHaveBeenCalledWith(
    expect.objectContaining({ filename: "invoice.html", fileType: "application/pdf" }),
  );
});

test("image upload rejects active SVG even when it claims to be PNG", async () => {
  const file = new File(['<svg onload="alert(document.domain)"></svg>'], "product.png", {
    type: "image/png",
  });

  await expect(call(uploadHandler, { file }, { context })).rejects.toMatchObject({
    code: "BAD_REQUEST",
  });
  expect(mocks.putObject).not.toHaveBeenCalled();
});
