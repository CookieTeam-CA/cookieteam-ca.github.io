"use server";

import { getTranslations } from "@/app/cookiecapes/i18n/server";
import type { MessageKey } from "@/app/cookiecapes/i18n/messages";
import { auth } from "../../auth";
import { isCookieCapesAdmin } from "@/lib/cookiecapes-admin";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "../cookiecapes/lib/api";
import { CapeApiError, capeApiError } from "../cookiecapes/lib/api-error";

async function moderate(validationError: MessageKey | undefined, request: () => { path: string; init: RequestInit }) {
  const { t, locale } = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: t("Please sign in.") };
  if (!isCookieCapesAdmin(session.user)) return { success: false, error: t("This action is only available to administrators.") };
  if (validationError) return { success: false, error: t(validationError) };

  try {
    const token = process.env.COOKIECAPES_API_TOKEN;
    if (!token) {
      console.error("COOKIECAPES_API_TOKEN is missing");
      return { success: false, error: t("The admin feature is not configured.") };
    }
    const { path, init } = request();
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw await capeApiError(response, locale);
    revalidatePath("/cookiecapes/capes");
    revalidatePath("/cookiecapes/players");
    return { success: true };
  } catch (error) {
    console.error("Moderation request failed:", error);
    return { success: false, error: error instanceof CapeApiError ? error.message : t("The API is temporarily unavailable.") };
  }
}

export async function deleteCape(capeId: number) {
  return moderate(!Number.isSafeInteger(capeId) || capeId < 1 ? "Invalid cape ID." : undefined,
    () => ({ path: `/delete_cape?cape_id=${capeId}`, init: { method: "DELETE" } }));
}

export async function banPlayer(identifier: string, reason = "Rule violation") {
  const invalid = typeof identifier !== "string" || !/^(?:[A-Za-z0-9_]{1,16}|[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.test(identifier) || typeof reason !== "string" || !reason.trim();
  return moderate(invalid ? "Please enter a valid player and a reason." : undefined,
    () => ({ path: "/ban_player", init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, reason }) } }));
}
