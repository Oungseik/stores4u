import { type CountryCode, currency } from "@repo/config";
import type { DehydratedState } from "@tanstack/svelte-query";

const replacements = {
  "<": "\\u003C",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};
const pattern = new RegExp(`[${Object.keys(replacements).join("")}]`, "g");

export function createDehydratedScript(dehydratedState: DehydratedState) {
  const escaped = JSON.stringify(dehydratedState).replace(
    pattern,
    (match) => replacements[match as keyof typeof replacements],
  );
  return `<script>window.dehydrated = ${escaped}</script>`;
}

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
export function getCountryName(code: CountryCode, locale = "en") {
  try {
    const regionNames = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
    return regionNames.of(code);
  } catch (error) {
    return code;
  }
}

export function formatPrice(cents: number, country?: CountryCode | null): string {
  const amount = (cents / 100).toFixed(2);
  if (!country) return amount;
  const config = currency[country];
  if (config?.prefix) return `${config.prefix}${amount}`;
  if (config?.suffix) return `${amount} ${config.suffix}`;
  return amount;
}
