"use server"

import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"
import { db } from "@/lib/db"
import { cachedEmails } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { ComposeMail } from "@/lib/zoho/types"

async function getClient() {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    throw new Error("Not authenticated")
  }
  return new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )
}

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")
  return session.user.id
}

export async function sendEmail(mail: ComposeMail) {
  const client = await getClient()
  await client.sendEmail(mail)
  return { success: true }
}

export async function markAsRead(messageId: string) {
  const client = await getClient()
  const userId = await getUserId()

  // Update local cache FIRST so refresh shows correct state
  await db
    .update(cachedEmails)
    .set({ isRead: true, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  // Then update Zoho
  try {
    await client.updateMessage(messageId, { isRead: true })
  } catch (error) {
    console.error("Failed to mark as read on Zoho:", error)
  }

  return { success: true }
}

export async function markAsUnread(messageId: string) {
  const client = await getClient()
  const userId = await getUserId()

  await db
    .update(cachedEmails)
    .set({ isRead: false, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    await client.updateMessage(messageId, { isRead: false })
  } catch (error) {
    console.error("Failed to mark as unread on Zoho:", error)
  }

  return { success: true }
}

export async function toggleFlag(messageId: string, isFlagged: boolean) {
  const client = await getClient()
  const userId = await getUserId()

  await db
    .update(cachedEmails)
    .set({ isFlagged, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    await client.updateMessage(messageId, { isFlagged })
  } catch (error) {
    console.error("Failed to toggle flag on Zoho:", error)
  }

  return { success: true }
}

export async function moveToFolder(messageId: string, destFolderId: string) {
  const client = await getClient()
  const userId = await getUserId()

  await db
    .update(cachedEmails)
    .set({ folderId: destFolderId, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    await client.updateMessage(messageId, { destfolderId: destFolderId })
  } catch (error) {
    console.error("Failed to move message on Zoho:", error)
  }

  return { success: true }
}

export async function deleteMessage(messageId: string, trashFolderId: string) {
  return moveToFolder(messageId, trashFolderId)
}

export async function searchEmails(query: string) {
  const client = await getClient()
  const results = await client.searchMessages(query, { limit: 50 })
  return results
}
