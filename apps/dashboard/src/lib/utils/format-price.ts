import { type CountryCode, currency } from "@repo/config";

export function formatPrice(
  cents: number,
  country?: CountryCode | null,
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

  if (!country) return formatted;

  const config = currency[country];
  if (config.prefix) {
    if (formatted.startsWith("-")) return `-${config.prefix}${formatted.slice(1)}`;
    return `${config.prefix}${formatted}`;
  }
  if (config.suffix) return `${formatted} ${config.suffix}`;
  return formatted;
}
