export type Locale = "en" | "de";
export const localeCookie = "cookiecapes.locale";

export function parseLocale(value?: string, acceptLanguage?: string | null): Locale {
  if (value === "en" || value === "de") return value;

  let preference = "";
  let bestQuality = 0;
  for (const range of (acceptLanguage ?? "").split(",")) {
    const match = range.trim().match(/^([a-z]+(?:-[a-z0-9]+)*|\*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i);
    if (!match) continue;
    const quality = match[2] === undefined ? 1 : Number(match[2]);
    if (quality > bestQuality) {
      bestQuality = quality;
      preference = match[1].toLowerCase();
    }
  }
  return preference === "de" || preference.startsWith("de-") ? "de" : "en";
}

export function localeCookieValue(locale: Locale, secure: boolean): string {
  return `${localeCookie}=${locale}; Path=/cookiecapes; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
}
