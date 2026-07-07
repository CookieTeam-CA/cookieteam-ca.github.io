"use server";

import { auth } from "../../auth";

const API_URL = "http://api.cookieattack.de:8100";
const COOKIECAPES_API_URL = "https://api.cookieattack.de:8989";

const getHeaders = () => {
  const token = process.env.COOKIEATTACK_BACKEND_KEY || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

export async function checkRegistration() {
  const session = await auth();
  if (!session?.user?.id) return { registered: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/get/${session.user.id}`, {
      headers: getHeaders(),
      cache: "no-store",
    });
    
    if (res.ok) {
      return { registered: true };
    }
    
    return { registered: false };
  } catch (err) {
    console.error("checkRegistration error:", err);
    return { registered: false, error: "Connection failed" };
  }
}

export async function registerUser(minecraft_uuid: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/add`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        discord_id: session.user.id,
        minecraft_uuid: minecraft_uuid
      }),
      cache: "no-store",
    });
    
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    console.error("Registration failed:", res.status, data);
    return { success: false, error: "Registration failed." };
  } catch (err) {
    console.error("registerUser error:", err);
    return { success: false, error: "Connection failed" };
  }
}

export async function unregisterUser() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/delete/${session.user.id}`, {
      method: "DELETE",
      headers: getHeaders(),
      cache: "no-store",
    });
    
    if (res.ok) {
      return { success: true };
    }
    
    return { success: false, error: "Failed to delete user." };
  } catch (err) {
    console.error("unregisterUser error:", err);
    return { success: false, error: "Connection failed" };
  }
}

export async function verifyMinecraftAccount(name: string) {
  try {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(name)}`);
    if (!res.ok) {
      return { success: false, error: "Minecraft Account nicht gefunden." };
    }
    const data = await res.json();
    if (data.code !== "player.found") {
      return { success: false, error: "Minecraft Account nicht gefunden." };
    }

    const uuid = data.data.player.id;
    const username = data.data.player.username;

    let capeId: number | null = null;
    try {
      const capeRes = await fetch(`${COOKIECAPES_API_URL}/get_player?identifier=${uuid}`, { cache: "no-store" });
      if (capeRes.ok) {
        const capeData = await capeRes.json();
        capeId = capeData.cape_id ?? null;
        console.log("[CookieCapes] Player data for", uuid, "→ cape_id:", capeId);
      } else {
        console.log("[CookieCapes] Player not found in CookieCapes, status:", capeRes.status);
      }
    } catch (e) {
      console.error("Failed to fetch cape for player:", e);
    }

    return { 
      success: true, 
      uuid, 
      username,
      capeUrl: capeId != null ? `https://api.cookieattack.de:8989/capes/${capeId}.png` : null
    };

  } catch (err) {
    console.error("verifyMinecraftAccount error:", err);
    return { success: false, error: "Fehler beim Überprüfen des Accounts." };
  }
}
