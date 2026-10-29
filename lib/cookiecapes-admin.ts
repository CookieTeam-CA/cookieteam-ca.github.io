import "server-only";
import { cache } from "react";
import { auth } from "@/auth";

export function isCookieCapesAdmin(user: { discordId?: string | null } | undefined): boolean {
  return !!user?.discordId && (process.env.ADMIN_DISCORD_IDS ?? "").split(",").some(id => id.trim() === user.discordId);
}

export const getCookieCapesAdmin = cache(async (): Promise<boolean> => {
  const session = await auth().catch(() => null);
  return !!session?.user?.id && isCookieCapesAdmin(session.user);
});
