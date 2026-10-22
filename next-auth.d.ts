import type { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface User { discordId?: string }
  interface Session { user: { id: string; discordId?: string } & DefaultSession["user"] }
}
