export const COUNTRIES = ["MM", "TH", "US"] as const;

export type CountryCode = (typeof COUNTRIES)[number];

export const currency: Record<CountryCode, { prefix?: string; suffix?: string }> = {
  MM: { suffix: "MMK" },
  TH: { prefix: "฿" },
  US: { prefix: "$" },
};

export const config = {
  lowStockThreshold: 10,
};
