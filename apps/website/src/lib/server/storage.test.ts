import { rmSync } from "node:fs";
import { expect, test } from "vitest";
import {
  deleteObject,
  extractObjectKey,
  getObject,
  getObjectStream,
  isSafeObjectKey,
  putObject,
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

test("objects round-trip through local disk", async () => {
  await putObject("images/smoke-test.webp", new TextEncoder().encode("hello"));
  try {
    expect((await getObject("images/smoke-test.webp")).toString()).toBe("hello");
    const streamed = await getObjectStream("images/smoke-test.webp");
    expect(streamed).not.toBeNull();
    expect(await new Response(streamed).text()).toBe("hello");
    await deleteObject("images/smoke-test.webp");
    expect(await getObjectStream("images/smoke-test.webp")).toBeNull();
    await expect(getObject("images/smoke-test.webp")).rejects.toThrow("Stored object not found");
  } finally {
    rmSync(".storage/images", { recursive: true, force: true });
  }
});

test("unsafe stored files are attachments with anti-sniffing headers", () => {
  expect(storageResponseHeaders("images/active.svg")).toMatchObject({
    "Content-Disposition": "attachment",
    "Content-Security-Policy": "sandbox; default-src 'none'",
    "Content-Type": "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
});
