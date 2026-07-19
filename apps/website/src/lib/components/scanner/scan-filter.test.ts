import { expect, test } from "vitest";

import { createBarcodeScanFilter } from "./scan-filter";

test("continuous frames are ignored until the barcode disappears", () => {
  const acceptScan = createBarcodeScanFilter(500);

  expect(acceptScan("A", 0)).toBe(true);
  expect(acceptScan("A", 100)).toBe(false);
  expect(acceptScan("A", 400)).toBe(false);
  expect(acceptScan("A", 901)).toBe(true);
  expect(acceptScan("B", 902)).toBe(true);
});
