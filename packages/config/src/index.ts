export const COUNTRIES = ["MM", "TH", "US"] as const;

export type CountryCode = (typeof COUNTRIES)[number];

export const CURRENCIES = ["MMK", "THB", "USD"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const LANGUAGES = ["en", "my"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.includes(value as Language);
}

export const DEFAULT_TIMEZONE = "UTC";

// Full IANA tz list from the runtime (Bun + modern browsers). Cached once —
// the underlying list is static for a given runtime build. UI-dropdown use
// only; do NOT use as a server-side enum — see isValidTimezone.
export const TIMEZONES: readonly string[] = Intl.supportedValuesOf("timeZone");

/**
 * Validates an IANA timezone by constructing a formatter. Robust against ICU
 * list drift: `Intl.supportedValuesOf("timeZone")` is runtime-specific (some
 * builds return obsolete names like Asia/Calcutta / Africa/Asmera and omit
 * Asia/Yangon), so it rejects valid tz strings on the server. This accepts
 * any tz the runtime's formatter understands, matching browsers.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export const config = {
  lowStockThreshold: 10,
};
