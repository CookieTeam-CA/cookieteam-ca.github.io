"use server";

import { auth } from "../../auth";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, CapeApiError, capeApiError } from "../cookiecapes/lib/api";

export async function banPlayer(identifier: string, reason: string = "Regelverstoß") {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { success: false, error: "Bitte melde dich an." };
    }

    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];
    if (!adminIds.includes(session.user.id)) {
        return { success: false, error: "Diese Aktion ist nur für Administratoren erlaubt." };
    }

    if (typeof identifier !== "string" || !/^(?:[A-Za-z0-9_]{1,16}|[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.test(identifier) || typeof reason !== "string" || !reason.trim()) {
        return { success: false, error: "Bitte gib einen gültigen Spieler und einen Grund an." };
    }

    try {
        const token = process.env.COOKIECAPES_API_TOKEN;
        if (!token) {
            console.error("COOKIECAPES_API_TOKEN is missing");
            return { success: false, error: "Die Admin-Funktion ist derzeit nicht konfiguriert." };
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
            throw await capeApiError(res);
        }
        
        revalidatePath("/cookiecapes/players");
        revalidatePath("/cookiecapes/capes");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in banPlayer:", error);
        return { success: false, error: error instanceof CapeApiError ? error.message : "Die API ist vorübergehend nicht erreichbar." };
    }
}
