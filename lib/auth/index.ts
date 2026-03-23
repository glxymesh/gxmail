import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"
import ZohoProvider from "./zoho-provider"
import { mapLocationToRegion, getAccountsBaseUrl, getMailBaseUrl } from "@/lib/zoho/region"
import type { ZohoAccountsResponse } from "@/lib/zoho/types"
import "./types"

async function refreshAccessToken(token: {
  refreshToken: string
  zohoRegion: string
}) {
  const baseUrl = getAccountsBaseUrl(token.zohoRegion || "com")
  const response = await fetch(`${baseUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: token.refreshToken,
      client_id: process.env.AUTH_ZOHO_ID!,
      client_secret: process.env.AUTH_ZOHO_SECRET!,
      grant_type: "refresh_token",
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.error}`)
  }

  return {
    accessToken: data.access_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
  }
}

async function fetchZohoAccountId(
  accessToken: string,
  region: string
): Promise<{ accountId: string; email: string; displayName: string } | null> {
  try {
    const baseUrl = getMailBaseUrl(region)
    const response = await fetch(`${baseUrl}/api/accounts`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!response.ok) return null

    const data: ZohoAccountsResponse = await response.json()
    if (data.data && data.data.length > 0) {
      return {
        accountId: data.data[0].accountId,
        email: data.data[0].primaryEmailAddress,
        displayName: data.data[0].displayName || data.data[0].accountDisplayName || "",
      }
    }
    return null
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
  session: { strategy: "jwt" },
  providers: [
    ZohoProvider({
      clientId: process.env.AUTH_ZOHO_ID!,
      clientSecret: process.env.AUTH_ZOHO_SECRET!,
      region: process.env.ZOHO_REGION || "in",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, store tokens and fetch Zoho account ID
      if (account) {
        const region = process.env.ZOHO_REGION || "in"

        token.accessToken = account.access_token ?? undefined
        token.refreshToken = account.refresh_token ?? undefined
        token.expiresAt = account.expires_at
        token.zohoRegion = region

        // Fetch the Zoho account ID, primary email, and display name
        if (token.accessToken) {
          const accountInfo = await fetchZohoAccountId(token.accessToken, region)
          if (accountInfo) {
            token.zohoAccountId = accountInfo.accountId
            token.zohoEmail = accountInfo.email
            // Use Zoho display name if profile name wasn't captured
            if (!token.name || token.name === "undefined undefined") {
              token.name = accountInfo.displayName || accountInfo.email
            }
            if (!token.email) {
              token.email = accountInfo.email
            }
          }
        }
      }

      // Check if token needs refresh
      if (token.expiresAt && Date.now() / 1000 > token.expiresAt - 60) {
        if (token.refreshToken && token.zohoRegion) {
          try {
            const refreshed = await refreshAccessToken({
              refreshToken: token.refreshToken,
              zohoRegion: token.zohoRegion,
            })
            token.accessToken = refreshed.accessToken
            token.expiresAt = refreshed.expiresAt
          } catch (error) {
            console.error("Failed to refresh Zoho token:", error)
            // Token refresh failed — user needs to re-authenticate
            token.error = "RefreshTokenError"
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? ""
        session.user.name = token.name ?? session.user.name ?? null
        session.user.email = token.email ?? session.user.email ?? null
        session.user.zohoAccountId = token.zohoAccountId ?? ""
        session.user.zohoRegion = token.zohoRegion ?? ""
        session.user.zohoEmail = token.zohoEmail ?? token.email ?? ""
        session.accessToken = token.accessToken ?? ""
      }
      return session
    },
  },
})
