import { expect, test } from "vitest";
import { localizePath } from "./localize-path";

test("localizePath rejects external redirects", () => {
  expect(localizePath("https://example.com/phishing")).toBe("/");
  expect(localizePath("//example.com/phishing")).toBe("/");
  expect(localizePath("/signin?return_url=%2Forders")).toBe("/signin?return_url=%2Forders");
});
