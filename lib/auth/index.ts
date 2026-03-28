import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"
import ZitadelProvider from "next-auth/providers/zitadel"
import { eq } from "drizzle-orm"
import "./types"

/**
 * Fetch user profile from Zitadel's userinfo endpoint.
 * The ID token only contains sub/iss/aud — actual user claims
 * (name, email, etc.) come from the userinfo endpoint.
 */
async function fetchZitadelUserInfo(accessToken: string): Promise<{
  name?: string
  email?: string
  picture?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
} | null> {
  try {
    const res = await fetch(
      `${process.env.AUTH_ZITADEL_ISSUER}/oidc/v1/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    ZitadelProvider({
      issuer: process.env.AUTH_ZITADEL_ISSUER!,
      clientId: process.env.AUTH_ZITADEL_CLIENT_ID!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.access_token) {
        const userInfo = await fetchZitadelUserInfo(account.access_token)
        console.log("[auth] Zitadel userinfo:", JSON.stringify(userInfo, null, 2))

        if (userInfo && user.id) {
          const name =
            userInfo.name ||
            userInfo.preferred_username ||
            [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ")

          try {
            await db
              .update(users)
              .set({
                name: name || undefined,
                email: userInfo.email || undefined,
                image: userInfo.picture || undefined,
                updatedAt: new Date(),
              })
              .where(eq(users.id, user.id))
          } catch (e) {
            console.error("[auth] Failed to update user profile:", e)
          }
        }
      }
      return true
    },
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
