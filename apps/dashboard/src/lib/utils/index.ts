import type { CountryCode } from "@repo/config";

/**
 * Get the full country name from a two-letter ISO country code.
 * @param code - The two-letter ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB').
 * @param locale - The locale in which to display the country name.
 * @returns The country name, or the code if a name cannot be found.
 */
export function getCountryName(code: CountryCode, locale = "en"): string | undefined {
  try {
    const regionNames = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
    return regionNames.of(code);
  } catch {
    return code;
  }
}

export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
