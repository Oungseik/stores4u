import { type CountryCode, type CurrencyCode, currency as currencyConfig } from "@repo/config";

export function getSeparator(locale: Intl.LocalesArgument, separatorType: "decimal" | "group") {
  const numberWithGroupAndDecimal = 10000.1;
  const parts = new Intl.NumberFormat(locale).formatToParts(numberWithGroupAndDecimal);
  const separatorPart = parts.find((part) => part.type === separatorType);
  return separatorPart ? separatorPart.value : "N/A";
}

export function getImageContentType(file: string) {
  return file.endsWith(".svg")
    ? "image/svg+xml"
    : file.endsWith("webp")
      ? "image/webp"
      : file.endsWith("png")
        ? "image/png"
        : "image/jpeg";
}

/**
 * Get the full country name from a two-letter ISO country code.
 * @param {string} code - The two-letter ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB').
 * @param {string} [locale='en'] - The locale in which to display the country name (e.g., 'en' for English, 'fr' for French).
 * @returns {string | undefined} The country name, or the code if a name cannot be found with fallback set to 'code'.
 */
export function getCountryName(code: CountryCode, locale = "en"): string | undefined {
  try {
    const regionNames = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
    return regionNames.of(code);
  } catch (_error) {
    return code;
  }
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

export function formatNumber(value: number, fraction = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value);
}

export function calcLineTotalCents(qty: number, unitCost: number): number {
  return Math.round(qty * unitCost * 100);
}

export function formatDate(date: Date | string, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("en-US", options).format(d);
}
