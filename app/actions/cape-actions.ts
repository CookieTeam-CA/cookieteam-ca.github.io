"use server";

import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

export async function deleteCape(capeId: number) {
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

        const res = await fetch(`https://api.cookieattack.de:8989/delete_cape?cape_id=${capeId}`, {
            method: 'DELETE',
            headers: {
                'authorization': `Bearer ${token}`,
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Failed to delete cape ${capeId}:`, errorText);
            return { success: false, error: `Failed to delete: ${res.statusText}` };
        }
        
        revalidatePath("/cookiecapes/capes");
        revalidatePath("/cookiecapes/players");
        
        return { success: true };

    } catch (error) {
        console.error("Exception in deleteCape:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
