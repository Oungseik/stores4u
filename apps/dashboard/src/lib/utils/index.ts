import { type CountryCode, type CurrencyCode, currency as currencyConfig } from "@repo/config";

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
  currency?: CurrencyCode | null,
  compactEnabled = true,
  threshold = 1_000_000,
): string {
  const amount = cents / 100;
  const compact = compactEnabled && Math.abs(amount) >= threshold;

  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    ...(compact
      ? { notation: "compact" as const, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }).format(amount);

  if (!currency) return formatted;

  const entry = Object.values(currencyConfig).find((c) => c.code === currency);
  if (entry?.prefix) {
    if (formatted.startsWith("-")) return `-${entry.prefix}${formatted.slice(1)}`;
    return `${entry.prefix}${formatted}`;
  }
  if (entry?.suffix) return `${formatted} ${entry.suffix}`;
  return formatted;
}
