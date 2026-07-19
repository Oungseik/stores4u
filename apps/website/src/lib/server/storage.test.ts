import { expect, test } from "vitest";
import { safeJoinPath, storageContentType, storageResponseHeaders } from "./storage";

const ROOT = "/srv/storage";

test("safeJoinPath keeps keys under root", () => {
  expect(safeJoinPath(ROOT, "images/abc.webp")).toBe("/srv/storage/images/abc.webp");
  expect(safeJoinPath(ROOT, "a/b/c.bin")).toBe("/srv/storage/a/b/c.bin");
});

test("safeJoinPath blocks path traversal", () => {
  expect(safeJoinPath(ROOT, "../../etc/passwd")).toBeNull();
  expect(safeJoinPath(ROOT, "../storage-secret")).toBeNull();
  expect(safeJoinPath(ROOT, "/etc/passwd")).toBeNull(); // absolute escape
});

test("safeJoinPath normalizes dot-segments that stay inside", () => {
  expect(safeJoinPath(ROOT, "images/../x.webp")).toBe("/srv/storage/x.webp");
});

test("safeJoinPath rejects empty/root-equal keys", () => {
  expect(safeJoinPath(ROOT, "")).toBeNull();
  expect(safeJoinPath(ROOT, ".")).toBeNull();
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
