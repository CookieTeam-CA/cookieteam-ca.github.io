"use server";

import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { auth } from "../../auth";
import { isCookieCapesAdmin } from "@/lib/cookiecapes-admin";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, CapeApiError, capeApiError } from "../cookiecapes/lib/api";

export async function banPlayer(identifier: string, reason: string = "Rule violation") {
  const { t, locale } = await getTranslations();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { success: false, error: t("Please sign in.") };
    }

    if (!isCookieCapesAdmin(session.user)) {
        return { success: false, error: t("This action is only available to administrators.") };
    }

    if (typeof identifier !== "string" || !/^(?:[A-Za-z0-9_]{1,16}|[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.test(identifier) || typeof reason !== "string" || !reason.trim()) {
        return { success: false, error: t("Please enter a valid player and a reason.") };
    }

    try {
        const token = process.env.COOKIECAPES_API_TOKEN;
        if (!token) {
            console.error("COOKIECAPES_API_TOKEN is missing");
            return { success: false, error: t("The admin feature is not configured.") };
        }

        const res = await fetch(`${API_BASE_URL}/ban_player`, {
            method: 'POST',
            signal: AbortSignal.timeout(15000),
            headers: {
                'authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier,
                reason
            })
        });

        if (!res.ok) {
            throw await capeApiError(res, locale);
        }
        
        revalidatePath("/cookiecapes/players");
        revalidatePath("/cookiecapes/capes");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in banPlayer:", error);
        return { success: false, error: error instanceof CapeApiError ? error.message : t("The API is temporarily unavailable.") };
    }
}
