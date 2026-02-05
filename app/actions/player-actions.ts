"use server";

import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function banPlayer(identifier: string, reason: string = "Regelverstoß") {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { success: false, error: "Unauthorized" };
    }

    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];
    if (!adminIds.includes(session.user.id)) {
        return { success: false, error: "Forbidden: You are not an admin." };
    }

    try {
        const token = process.env.COOKIECAPES_API_TOKEN;
        if (!token) {
            console.error("COOKIECAPES_API_TOKEN is missing");
            return { success: false, error: "Server Configuration Error" };
        }

        const res = await fetch(`https://api.cookieattack.de:8989/ban_player`, {
            method: 'POST',
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
            const errorData = await res.json().catch(() => ({}));
            console.error(`Failed to ban player ${identifier}:`, errorData);
            return { success: false, error: `Failed to ban: ${res.statusText}` };
        }
        
        revalidatePath("/cookiecapes/players");
        revalidatePath("/cookiecapes/capes");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in banPlayer:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
