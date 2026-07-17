export const COUNTRIES = ["MM", "TH", "US"] as const;

export type CountryCode = (typeof COUNTRIES)[number];

export const CURRENCIES = ["MMK", "THB", "USD"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_TIMEZONE = "UTC";

// Full IANA tz list from the runtime (Bun + modern browsers). Cached once —
// the underlying list is static for a given runtime build.
export const TIMEZONES: readonly string[] = Intl.supportedValuesOf("timeZone");

export const config = {
  lowStockThreshold: 10,
};
