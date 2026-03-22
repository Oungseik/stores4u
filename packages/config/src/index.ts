export const COUNTRIES = ["MM", "TH", "US"] as const;

export type CountryCode = (typeof COUNTRIES)[number];

export const currency: Record<CountryCode, { prefix?: string; suffix?: string; code: string }> = {
  MM: { suffix: "MMK", code: "MMK" },
  TH: { prefix: "฿", code: "THB" },
  US: { prefix: "$", code: "USD" },
};

export const config = {
  lowStockThreshold: 10,
};

export * from "./platform";
