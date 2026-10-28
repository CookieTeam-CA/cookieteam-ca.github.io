"use server";

import { auth } from "../../auth";
import { API_BASE_URL } from "../cookiecapes/lib/api";

const API_URL = "https://capi.cookieattack.de";

const getHeaders = () => {
  const token = process.env.COOKIEATTACK_BACKEND_KEY || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

export async function checkRegistration() {
  const session = await auth();
  if (!session?.user?.discordId) return { registered: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/get/${session.user.discordId}`, {
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
  if (!session?.user?.discordId) return { success: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/add`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        discord_id: session.user.discordId,
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
  if (!session?.user?.discordId) return { success: false, error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/users/delete/${session.user.discordId}`, {
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

    let capeUrl: string | null = null;
    try {
      const capeRes = await fetch(`${API_BASE_URL}/get_player?identifier=${uuid}`, { cache: "no-store" });
      if (capeRes.ok) {
        const capeData = await capeRes.json();
        capeUrl = capeData.cape_image_url || (capeData.cape_id != null ? `${API_BASE_URL}/capes/${capeData.cape_id}.png` : null);
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
      capeUrl
    };

  } catch (err) {
    console.error("verifyMinecraftAccount error:", err);
    return { success: false, error: "Fehler beim Überprüfen des Accounts." };
  }
}
