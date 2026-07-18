import { afterEach, describe, expect, it } from "vitest";
import { overwriteGetLocale } from "$lib/paraglide/runtime";
import { localizeError } from "./error-message";

afterEach(() => overwriteGetLocale(() => "en"));

describe("localizeError", () => {
  it("renders structured errors with interpolation", () => {
    overwriteGetLocale(() => "en");
    expect(
      localizeError({
        data: {
          key: "error_insufficient_stock",
          values: { available: 3, requested: 5 },
        },
      }),
    ).toBe("Insufficient stock. Available: 3, requested: 5");
  });

  it("renders Burmese and hides unknown raw messages", () => {
    overwriteGetLocale(() => "my");
    expect(localizeError(new Error("secret raw error"))).toBe("တစ်ခုခု မှားယွင်းနေပါသည်");
  });

  it("maps known authentication codes", () => {
    overwriteGetLocale(() => "en");
    expect(localizeError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Email or password is incorrect.",
    );
  });

  it("translates SvelteKit error message keys", () => {
    overwriteGetLocale(() => "my");
    expect(localizeError({ message: "error_invite_expired" })).toBe(
      "ဤဖိတ်ကြားချက်လင့်ခ်သည် သက်တမ်းကုန်သွားပြီ သို့မဟုတ် အသုံးပြုပြီးဖြစ်သည်။",
    );
  });
});
