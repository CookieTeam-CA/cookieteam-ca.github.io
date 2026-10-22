import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { CookieApiAdapter, websiteSessionCookie } from "./lib/cookieapi-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CookieApiAdapter(),
  pages: { error: "/cookiecapes/account/signin-error" },
  session: { strategy: "database" },
  cookies: {
    sessionToken: {
      name: websiteSessionCookie,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
  providers: [Discord({ issuer: "https://discord.com" })],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.discordId = user.discordId;
      return session;
    },
  },
});
