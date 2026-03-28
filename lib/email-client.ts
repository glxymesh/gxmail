import { db } from "@/lib/db"
import { linkedEmailAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ZohoMailClient } from "@/lib/zoho/client"
import { GmailClient } from "@/lib/gmail/client"
import { getProvider, getDefaultLinkedAccount, getLinkedAccountById } from "@/lib/linked-accounts"
import { auth } from "@/lib/auth"
import type { MailClient } from "@/lib/mail-client"

/**
 * Get an email client for the current user's linked account.
 * Reads tokens from the DB (not the session).
 * Auto-refreshes expired tokens.
 */
export async function getEmailClient(linkedAccountId?: string): Promise<{
  client: MailClient
  account: typeof linkedEmailAccounts.$inferSelect
  userId: string
}> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")

  const userId = session.user.id

  // Get the linked account from DB
  const account = linkedAccountId
    ? await getLinkedAccountById(linkedAccountId)
    : await getDefaultLinkedAccount(userId)

  if (!account) {
    throw new Error("No email account linked. Please connect an email account.")
  }

  if (account.userId !== userId) {
    throw new Error("Unauthorized access to linked account")
  }

  // Auto-refresh if token expired
  let accessToken = account.accessToken
  if (account.expiresAt && Date.now() / 1000 > account.expiresAt - 60) {
    if (account.refreshToken) {
      try {
        const provider = getProvider(account.provider)
        const refreshed = await provider.refreshToken(account.refreshToken)
        accessToken = refreshed.access_token

        await db
          .update(linkedEmailAccounts)
          .set({
            accessToken: refreshed.access_token,
            expiresAt: refreshed.expires_in
              ? Math.floor(Date.now() / 1000) + refreshed.expires_in
              : account.expiresAt,
          })
          .where(eq(linkedEmailAccounts.id, account.id))
      } catch (error) {
        console.error("Token refresh failed:", error)
        throw new Error("Email account token expired. Please reconnect.")
      }
    }
  }

  // Return the appropriate client based on provider
  let client: MailClient

  switch (account.provider) {
    case "zoho":
      client = new ZohoMailClient(accessToken, account.providerAccountId, account.region || "in")
      break
    case "gmail":
      client = new GmailClient(accessToken)
      break
    default:
      throw new Error(`Provider ${account.provider} not yet supported`)
  }

  return { client, account, userId }
}

/**
 * Get just the userId from the session (no email client needed).
 */
export async function getAuthUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}
