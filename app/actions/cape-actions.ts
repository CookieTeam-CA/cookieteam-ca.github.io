"use server";

import { getTranslations } from "@/app/cookiecapes/i18n/server";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, CapeApiError, capeApiError } from "../cookiecapes/lib/api";

export async function deleteCape(capeId: number) {
  const { t, locale } = await getTranslations();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { success: false, error: t("Please sign in.") };
    }

    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];
    if (!adminIds.includes(session.user.discordId ?? "")) {
        return { success: false, error: t("This action is only available to administrators.") };
    }

    if (!Number.isSafeInteger(capeId) || capeId < 1) return { success: false, error: t("Invalid cape ID.") };

    try {
        const token = process.env.COOKIECAPES_API_TOKEN;
        if (!token) {
            console.error("COOKIECAPES_API_TOKEN is missing");
            return { success: false, error: t("The admin feature is not configured.") };
        }

        const res = await fetch(`${API_BASE_URL}/delete_cape?cape_id=${capeId}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(15000),
            headers: {
                'authorization': `Bearer ${token}`,
            }
        });

        if (!res.ok) {
            throw await capeApiError(res, locale);
        }
        
        revalidatePath("/cookiecapes/capes");
        revalidatePath("/cookiecapes/players");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in deleteCape:", error);
        return { success: false, error: error instanceof CapeApiError ? error.message : t("The API is temporarily unavailable.") };
    }
}
