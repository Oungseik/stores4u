import type { Country, CountryCode, DetailedValue, TelInputOptions } from "svelte-tel-input/types";

export type PhoneInputProps = {
  country?: CountryCode | null;
  defaultCountry?: CountryCode | null;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  class?: string;
  value?: string;
  valid?: boolean;
  detailedValue?: Partial<DetailedValue> | null;
  options?: TelInputOptions;
  order?: ((a: Country, b: Country) => number) | undefined;
  onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  /** E164 value emitted by svelte-tel-input on every parse. Prefer this over `onchange`,
   * whose `currentTarget.value` is the formatted display string (may lack the dial code). */
  onValueChange?: (value: string, detailedValue: Partial<DetailedValue> | null) => void;
};
