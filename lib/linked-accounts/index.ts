import { db } from "@/lib/db"
import { linkedEmailAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { ZohoEmailProvider } from "./zoho"
import type { EmailProvider } from "./types"

// Provider registry
const providers: Record<string, () => EmailProvider> = {
  zoho: () => new ZohoEmailProvider(),
}

export function getProvider(providerId: string): EmailProvider {
  const factory = providers[providerId]
  if (!factory) throw new Error(`Unknown email provider: ${providerId}`)
  return factory()
}

export async function getLinkedAccounts(userId: string) {
  return db.query.linkedEmailAccounts.findMany({
    where: eq(linkedEmailAccounts.userId, userId),
    orderBy: (table, { desc }) => [desc(table.isDefault), desc(table.linkedAt)],
  })
}

export async function getDefaultLinkedAccount(userId: string) {
  // Try default first, then fall back to any account
  const defaultAccount = await db.query.linkedEmailAccounts.findFirst({
    where: and(
      eq(linkedEmailAccounts.userId, userId),
      eq(linkedEmailAccounts.isDefault, true)
    ),
  })
  if (defaultAccount) return defaultAccount

  return db.query.linkedEmailAccounts.findFirst({
    where: eq(linkedEmailAccounts.userId, userId),
  })
}

export async function getLinkedAccountById(accountId: string) {
  return db.query.linkedEmailAccounts.findFirst({
    where: eq(linkedEmailAccounts.id, accountId),
  })
}

export async function hasLinkedAccounts(userId: string): Promise<boolean> {
  const account = await db.query.linkedEmailAccounts.findFirst({
    where: eq(linkedEmailAccounts.userId, userId),
    columns: { id: true },
  })
  return !!account
}

export async function unlinkAccount(userId: string, accountId: string) {
  await db
    .delete(linkedEmailAccounts)
    .where(
      and(
        eq(linkedEmailAccounts.id, accountId),
        eq(linkedEmailAccounts.userId, userId)
      )
    )
}
