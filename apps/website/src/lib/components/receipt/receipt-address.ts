import { getCountryName } from "$lib/utils";
import type { CountryCode } from "@repo/config";

type AddressData = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: CountryCode | null;
};

type AddressConfig = {
  showAddress: boolean;
  showState: boolean;
  showCountry: boolean;
};

export function receiptAddressLines(data: AddressData, config: AddressConfig): string[] {
  const lines: string[] = [];

  if (config.showAddress && data.address) lines.push(data.address);

  const cityState = [config.showAddress ? data.city : null, config.showState ? data.state : null]
    .filter(Boolean)
    .join(", ");
  if (cityState) lines.push(cityState);

  if (config.showCountry && data.country) {
    lines.push(getCountryName(data.country) ?? data.country);
  }

  return lines;
}
