// @vitest-environment jsdom

import { afterEach, beforeEach, expect, test, vi } from "vitest";

const toBlob = vi.hoisted(() => vi.fn());
vi.mock("html-to-image", () => ({ toBlob }));

import { saveOrShareInvoiceImage } from "./invoice-image";

beforeEach(() => {
  toBlob.mockResolvedValue(new Blob(["invoice"], { type: "image/png" }));
});

afterEach(() => vi.restoreAllMocks());

test("shares an invoice PNG when the browser supports file sharing", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperties(navigator, {
    canShare: { configurable: true, value: () => true },
    share: { configurable: true, value: share },
  });

  await saveOrShareInvoiceImage(document.body, "invoice-123.png");

  expect(share).toHaveBeenCalledWith({
    files: [expect.any(File)],
    title: "invoice-123.png",
  });
});

test("downloads the PNG when sharing fails", async () => {
  Object.defineProperties(navigator, {
    canShare: { configurable: true, value: () => true },
    share: {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
    },
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  Object.defineProperties(URL, {
    createObjectURL: { configurable: true, value: () => "blob:invoice" },
    revokeObjectURL: { configurable: true, value: vi.fn() },
  });

  await saveOrShareInvoiceImage(document.body, "invoice-123.png");

  expect(click).toHaveBeenCalledOnce();
});

test("downloads the PNG when file sharing is unavailable", async () => {
  Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const createObjectURL = vi.fn(() => "blob:invoice");
  const revokeObjectURL = vi.fn();
  Object.defineProperties(URL, {
    createObjectURL: { configurable: true, value: createObjectURL },
    revokeObjectURL: { configurable: true, value: revokeObjectURL },
  });

  await saveOrShareInvoiceImage(document.body, "invoice-123.png");

  expect(click).toHaveBeenCalledOnce();
  expect(createObjectURL).toHaveBeenCalledOnce();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
});
