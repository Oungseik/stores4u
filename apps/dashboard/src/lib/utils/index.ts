import { type CountryCode, currency } from "@repo/config";

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

export function formatPrice(
  cents: number,
  country?: CountryCode | null,
  compactEnabled = true,
): string {
  const amount = cents / 100;
  const compact = compactEnabled && Math.abs(amount) >= 1_000_000;

  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    ...(compact
      ? { notation: "compact" as const, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }).format(amount);

  if (!country) return formatted;

  const config = currency[country];
  if (config.prefix) {
    if (formatted.startsWith("-")) return `-${config.prefix}${formatted.slice(1)}`;
    return `${config.prefix}${formatted}`;
  }
  if (config.suffix) return `${formatted} ${config.suffix}`;
  return formatted;
}
