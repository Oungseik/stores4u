type PhoneDetails = {
  e164?: string | null;
  isPhoneValid?: boolean;
  isValid?: boolean;
} | null;

export function phoneValue(value: string, detailedValue: PhoneDetails) {
  if (!value.trim()) return null;
  if (detailedValue?.e164 && (detailedValue.isValid ?? detailedValue.isPhoneValid)) {
    return detailedValue.e164;
  }
  return undefined;
}
