import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeE164(value: string, defaultCountry: "EG" = "EG"): string | null {
  const parsed = parsePhoneNumberFromString(value.trim(), defaultCountry);
  return parsed?.isValid() ? parsed.number : null;
}
