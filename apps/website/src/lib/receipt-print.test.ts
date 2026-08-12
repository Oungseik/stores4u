// @vitest-environment jsdom

import { afterEach, expect, test, vi } from "vitest";
import { printReceipt } from "./receipt-print";

afterEach(() => {
  document.body.classList.remove("printing-receipt");
  vi.restoreAllMocks();
});

test("waits for receipt images and applies print styles while printing", async () => {
  let resolveImage!: () => void;
  const imageReady = new Promise<void>((resolve) => {
    resolveImage = resolve;
  });
  const image = document.createElement("img");
  const decode = vi.fn(() => imageReady);
  Object.defineProperty(image, "decode", { value: decode });

  const receipt = document.createElement("div");
  receipt.append(image);

  const print = vi.spyOn(window, "print").mockImplementation(() => {
    expect(document.body.classList.contains("printing-receipt")).toBe(true);
  });
  const printing = printReceipt(receipt);

  await vi.waitFor(() => expect(decode).toHaveBeenCalledOnce());
  expect(print).not.toHaveBeenCalled();

  resolveImage();
  await printing;

  expect(print).toHaveBeenCalledOnce();
  expect(document.body.classList.contains("printing-receipt")).toBe(false);
});
