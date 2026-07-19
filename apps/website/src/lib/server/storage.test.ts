import { expect, test } from "vitest";
import {
  extractObjectKey,
  isSafeObjectKey,
  storageContentType,
  storageResponseHeaders,
} from "./storage";

test("storage keys reject empty and traversal segments", () => {
  expect(isSafeObjectKey("images/abc.webp")).toBe(true);
  expect(isSafeObjectKey("")).toBe(false);
  expect(isSafeObjectKey("../secret")).toBe(false);
  expect(isSafeObjectKey("images/../secret")).toBe(false);
  expect(isSafeObjectKey("/images/abc.webp")).toBe(false);
});

test("stored app URLs resolve back to their R2 key", () => {
  expect(extractObjectKey("/storage/images/abc.webp")).toBe("images/abc.webp");
  expect(extractObjectKey("https://store.example/storage/invoice-files/id.pdf")).toBe(
    "invoice-files/id.pdf",
  );
  expect(extractObjectKey("https://other.example/file.pdf")).toBeNull();
});

test("storage derives safe content types from canonical extensions", () => {
  expect(storageContentType("invoice-files/id.pdf")).toBe("application/pdf");
  expect(storageContentType("images/id.webp")).toBe("image/webp");
  expect(storageContentType("invoice-files/disguised.html")).toBe("application/octet-stream");
});

test("unsafe stored files are attachments with anti-sniffing headers", () => {
  expect(storageResponseHeaders("images/active.svg")).toMatchObject({
    "Content-Disposition": "attachment",
    "Content-Security-Policy": "sandbox; default-src 'none'",
    "Content-Type": "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
});
