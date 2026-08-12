import { expect, test } from "vitest";
import { receiptAddressLines } from "./receipt-address";

const address = {
  address: "1 Main Street",
  city: "Austin",
  state: "Texas",
  country: "US" as const,
};

test("receipt state and country visibility are controlled independently", () => {
  expect(
    receiptAddressLines(address, { showAddress: true, showState: false, showCountry: true }),
  ).toEqual(["1 Main Street", "Austin", "United States"]);
  expect(
    receiptAddressLines(address, { showAddress: false, showState: true, showCountry: false }),
  ).toEqual(["Texas"]);
});
