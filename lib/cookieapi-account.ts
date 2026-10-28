import { getTranslations } from "@/app/cookiecapes/i18n/server";
import "server-only";
import { cookies } from "next/headers";
import { capeApiError } from "@/app/cookiecapes/lib/api";
import { cookieApiUrl, serviceHeaders, websiteSessionCookie } from "./cookieapi-adapter";

export async function accountFetch(path: string, init: RequestInit = {}) {
  const { t, locale } = await getTranslations();
  const token = (await cookies()).get(websiteSessionCookie)?.value;
  if (!token) throw new Error(t("Please sign in again."));
  const headers = serviceHeaders();
  new Headers(init.headers).forEach((value, key) => {
    if (!["authorization", "x-website-session"].includes(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("X-Website-Session", token);
  const response = await fetch(`${cookieApiUrl()}${path}`, {
    ...init, headers, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw await capeApiError(response, locale);
  return response;
}

export async function accountJson<T>(path: string, data?: unknown): Promise<T> {
  const response = await accountFetch(path, data === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  return response.json();
}
