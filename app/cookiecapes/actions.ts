"use server";

import { cookies } from "next/headers";
import { getStats, getPlayerCount, StatsResponse } from "./lib/api";

export async function fetchStatsAction(): Promise<StatsResponse | null> {
    return await getStats();
}

export async function fetchPlayerCountAction(): Promise<number> {
    return await getPlayerCount();
}

export async function uploadCape(prevState: any, formData: FormData) {
  const WORKER_URL = "https://cloudcookieapi.leonmt12345.workers.dev";
  
  const minecraftName = formData.get("minecraft_name");
  const capeName = formData.get("cape_name");
  const capeFile = formData.get("cape");

  if (!minecraftName || !capeName || !capeFile) {
    return { error: "Bitte fülle alle Felder aus." };
  }

  try {
    const res = await fetch(`${WORKER_URL}/web_add_cape`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 469) {
            return { error: "Cape wurde von der Moderation blockiert." };
        }
        if (res.status === 429) {
             return { error: "Zu viele Anfragen. Bitte versuche es morgen erneut." };
        }
        return { error: errorData.detail || `Upload fehlgeschlagen: ${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    
    const cookieStore = await cookies();
    cookieStore.set('cape_upload_limit', 'true', { 
        maxAge: 60 * 60 * 24, 
        path: '/',
        secure: process.env.NODE_ENV === 'production'
    });

    return { success: true, capeId: data.cape_id };

  } catch (error) {
    console.error("Upload Error:", error);
    return { error: "Ein unerwarteter Fehler ist aufgetreten." };
  }
}
