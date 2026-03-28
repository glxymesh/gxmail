import { db } from "@/lib/db"
import { cachedEmails, emailCacheMetadata } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import type { MailClient, NormalizedMessage } from "@/lib/mail-client"

function mapMessage(msg: NormalizedMessage, userId: string) {
  return {
    userId,
    messageId: String(msg.messageId),
    folderId: String(msg.folderId),
    threadId: msg.threadId ? String(msg.threadId) : null,
    subject: msg.subject,
    fromAddress: msg.fromAddress,
    toAddress: msg.toAddress,
    ccAddress: msg.ccAddress || null,
    snippet: msg.summary,
    receivedAt: new Date(parseInt(msg.receivedTime)),
    isRead: msg.status === "1",
    isFlagged: msg.flagid !== "0",
    hasAttachment: msg.hasAttachment === "1",
    size: msg.size,
    syncedAt: new Date(),
  }
}

export async function syncMessages(
  client: MailClient,
  userId: string,
  folderId: string,
  opts?: { limit?: number; start?: number }
) {
  const limit = opts?.limit ?? 200
  const start = opts?.start ?? 1

  const messages = await client.getMessages(folderId, { start, limit })
  const now = new Date()

  let newCount = 0
  let updatedCount = 0

  for (const msg of messages) {
    const mapped = mapMessage(msg, userId)

    // Atomic upsert — no race conditions.
    // On conflict: only overwrite isRead/isFlagged if the row wasn't
    // locally modified in the last 2 minutes (preserves optimistic updates).
    await db
      .insert(cachedEmails)
      .values(mapped)
      .onConflictDoUpdate({
        target: [cachedEmails.userId, cachedEmails.messageId],
        set: {
          folderId: mapped.folderId,
          subject: mapped.subject,
          fromAddress: mapped.fromAddress,
          toAddress: mapped.toAddress,
          ccAddress: mapped.ccAddress,
          snippet: mapped.snippet,
          hasAttachment: mapped.hasAttachment,
          size: mapped.size,
          // Only overwrite read/flag if not recently modified locally
          isRead: sql`CASE WHEN ${cachedEmails.syncedAt} > NOW() - INTERVAL '2 minutes' THEN ${cachedEmails.isRead} ELSE ${mapped.isRead} END`,
          isFlagged: sql`CASE WHEN ${cachedEmails.syncedAt} > NOW() - INTERVAL '2 minutes' THEN ${cachedEmails.isFlagged} ELSE ${mapped.isFlagged} END`,
          syncedAt: now,
        },
      })

    newCount++
  }

  // Upsert cache metadata
  const oldestMessage = messages.length > 0
    ? new Date(parseInt(messages[messages.length - 1].receivedTime))
    : null

  await db
    .insert(emailCacheMetadata)
    .values({
      userId,
      folderId,
      lastSyncAt: now,
      oldestMessageDate: oldestMessage,
      totalCached: newCount,
    })
    .onConflictDoUpdate({
      target: [emailCacheMetadata.userId, emailCacheMetadata.folderId],
      set: {
        lastSyncAt: now,
        oldestMessageDate: oldestMessage || sql`${emailCacheMetadata.oldestMessageDate}`,
        totalCached: sql`${emailCacheMetadata.totalCached} + ${newCount}`,
      },
    })

  return { newCount, updatedCount, total: messages.length }
}
