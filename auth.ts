import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Discord],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.sub = account.providerAccountId;
      } else if (user && !token.sub) {
        token.sub = user.id;
      }
      return token;
    }
  }
})
