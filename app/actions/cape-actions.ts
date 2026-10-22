"use server";

import { auth } from "../../auth";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, CapeApiError, capeApiError } from "../cookiecapes/lib/api";

export async function deleteCape(capeId: number) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { success: false, error: "Bitte melde dich an." };
    }

    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];
    if (!adminIds.includes(session.user.discordId ?? "")) {
        return { success: false, error: "Diese Aktion ist nur für Administratoren erlaubt." };
    }

    if (!Number.isSafeInteger(capeId) || capeId < 1) return { success: false, error: "Ungültige Cape-ID." };

    try {
        const token = process.env.COOKIECAPES_API_TOKEN;
        if (!token) {
            console.error("COOKIECAPES_API_TOKEN is missing");
            return { success: false, error: "Die Admin-Funktion ist derzeit nicht konfiguriert." };
        }

        const res = await fetch(`${API_BASE_URL}/delete_cape?cape_id=${capeId}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(15000),
            headers: {
                'authorization': `Bearer ${token}`,
            }
        });

        if (!res.ok) {
            throw await capeApiError(res);
        }
        
        revalidatePath("/cookiecapes/capes");
        revalidatePath("/cookiecapes/players");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in deleteCape:", error);
        return { success: false, error: error instanceof CapeApiError ? error.message : "Die API ist vorübergehend nicht erreichbar." };
    }
}
