import "server-only";

export function isCookieCapesAdmin(user: { discordId?: string | null } | undefined): boolean {
  return !!user?.discordId && (process.env.ADMIN_DISCORD_IDS ?? "").split(",").some(id => id.trim() === user.discordId);
}
