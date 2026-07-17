import { expect, test } from "vitest";
import { storeDate, storePeriodStarts } from "./timezone";

test("store calendar math survives DST transitions", () => {
  const newYork = storeDate(new Date("2025-03-10T04:30:00Z"), "America/New_York");
  expect(newYork.subtract({ days: 1 }).toString()).toBe("2025-03-09");

  const cairo = storePeriodStarts(new Date("2025-04-25T12:00:00Z"), "Africa/Cairo");
  expect(cairo.today.toISOString()).toBe("2025-04-24T22:00:00.000Z");
});
