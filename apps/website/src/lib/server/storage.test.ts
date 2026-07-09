import { expect, test } from "vitest";
import { safeJoinPath } from "./storage";

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
