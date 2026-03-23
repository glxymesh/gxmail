import { db } from "@/lib/db"
import { cachedEmails, emailCacheMetadata } from "@/lib/db/schema"
import { ZohoMailClient } from "@/lib/zoho/client"
import { eq, and } from "drizzle-orm"
import type { ZohoMessage } from "@/lib/zoho/types"

function mapZohoMessage(msg: ZohoMessage, userId: string) {
  return {
    userId,
    messageId: msg.messageId,
    folderId: msg.folderId,
    threadId: msg.threadId || null,
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
  client: ZohoMailClient,
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
    const mapped = mapZohoMessage(msg, userId)

    const existing = await db.query.cachedEmails.findFirst({
      where: and(
        eq(cachedEmails.userId, userId),
        eq(cachedEmails.messageId, msg.messageId)
      ),
    })

    if (existing) {
      await db
        .update(cachedEmails)
        .set({
          isRead: mapped.isRead,
          isFlagged: mapped.isFlagged,
          folderId: mapped.folderId,
          syncedAt: now,
        })
        .where(eq(cachedEmails.id, existing.id))
      updatedCount++
    } else {
      await db.insert(cachedEmails).values(mapped)
      newCount++
    }
  }

  // Update cache metadata
  const existingMeta = await db.query.emailCacheMetadata.findFirst({
    where: and(
      eq(emailCacheMetadata.userId, userId),
      eq(emailCacheMetadata.folderId, folderId)
    ),
  })

  const oldestMessage = messages.length > 0
    ? new Date(parseInt(messages[messages.length - 1].receivedTime))
    : null

  if (existingMeta) {
    await db
      .update(emailCacheMetadata)
      .set({
        lastSyncAt: now,
        oldestMessageDate: oldestMessage || existingMeta.oldestMessageDate,
        totalCached: (existingMeta.totalCached || 0) + newCount,
      })
      .where(eq(emailCacheMetadata.id, existingMeta.id))
  } else {
    await db.insert(emailCacheMetadata).values({
      userId,
      folderId,
      lastSyncAt: now,
      oldestMessageDate: oldestMessage,
      totalCached: newCount,
    })
  }

  return { newCount, updatedCount, total: messages.length }
}
