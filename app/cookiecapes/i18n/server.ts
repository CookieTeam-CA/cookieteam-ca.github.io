import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { localeCookie, parseLocale } from "./locale";
import { translations } from "./messages";

export const getLocale = cache(async () => {
  const requestHeaders = await headers();
  // Browsers send the most specific cookie first; cookies().get() keeps the last duplicate.
  const selected = requestHeaders.get("cookie")?.split(";")
    .map(cookie => cookie.trim().split("="))
    .find(([name]) => name === localeCookie)?.[1];
  return parseLocale(selected, requestHeaders.get("accept-language"));
});
export async function getTranslations() {
  return translations(await getLocale());
}
