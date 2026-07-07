import { expect, test } from "vitest";

import { phoneValue } from "./phone-value";

test("phoneValue rejects invalid parsed phone numbers even when E.164 exists", () => {
  expect(phoneValue("   ", null)).toBeNull();
  expect(phoneValue("+1 415 555 2671", { e164: "+14155552671", isValid: true })).toBe(
    "+14155552671",
  );
  expect(phoneValue("+12", { e164: "+12", isValid: false })).toBeUndefined();
});
