export const COUNTRIES = ["MM", "TH", "US"] as const;

export type CountryCode = (typeof COUNTRIES)[number];

export const CURRENCIES = ["MMK", "THB", "USD"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const config = {
  lowStockThreshold: 10,
};

export * from "./platform";
