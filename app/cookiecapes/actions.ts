"use server";

import { getPlayerCount } from "./lib/api";

export async function fetchPlayerCountAction(): Promise<number | null> {
    try { return await getPlayerCount(); }
    catch (error) { console.error("Failed to load player count:", error); return null; }
}
