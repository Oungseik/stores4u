import { expect, test } from "vitest";
import { invoiceAddressLines } from "./invoice-address";

const address = {
  address: "1 Main Street",
  city: "Austin",
  state: "Texas",
  country: "US" as const,
};

test("invoice state and country visibility are controlled independently", () => {
  expect(
    invoiceAddressLines(address, { showAddress: true, showState: false, showCountry: true }),
  ).toEqual(["1 Main Street", "Austin", "United States"]);
  expect(
    invoiceAddressLines(address, { showAddress: false, showState: true, showCountry: false }),
  ).toEqual(["Texas"]);
});
