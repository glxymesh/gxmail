"use server"

import { db } from "@/lib/db"
import { cachedEmails } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getEmailClient, getAuthUserId } from "@/lib/email-client"
import type { ComposeMail } from "@/lib/zoho/types"

export async function sendEmail(mail: ComposeMail) {
  const { client } = await getEmailClient()
  await client.sendEmail(mail)
  return { success: true }
}

export async function markAsRead(messageId: string) {
  const userId = await getAuthUserId()

  // Update local cache first
  await db
    .update(cachedEmails)
    .set({ isRead: true, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  // Then update remote
  try {
    const { client } = await getEmailClient()
    await client.updateMessage(messageId, { isRead: true })
  } catch (error) {
    console.error("Failed to mark as read on remote:", error)
  }

  return { success: true }
}

export async function markAsUnread(messageId: string) {
  const userId = await getAuthUserId()

  await db
    .update(cachedEmails)
    .set({ isRead: false, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    const { client } = await getEmailClient()
    await client.updateMessage(messageId, { isRead: false })
  } catch (error) {
    console.error("Failed to mark as unread on remote:", error)
  }

  return { success: true }
}

export async function toggleFlag(messageId: string, isFlagged: boolean) {
  const userId = await getAuthUserId()

  await db
    .update(cachedEmails)
    .set({ isFlagged, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    const { client } = await getEmailClient()
    await client.updateMessage(messageId, { isFlagged })
  } catch (error) {
    console.error("Failed to toggle flag on remote:", error)
  }

  return { success: true }
}

export async function moveToFolder(messageId: string, destFolderId: string) {
  const userId = await getAuthUserId()

  await db
    .update(cachedEmails)
    .set({ folderId: destFolderId, syncedAt: new Date() })
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.messageId, messageId))
    )

  try {
    const { client } = await getEmailClient()
    await client.updateMessage(messageId, { destfolderId: destFolderId })
  } catch (error) {
    console.error("Failed to move message on remote:", error)
  }

  return { success: true }
}

export async function deleteMessage(messageId: string, trashFolderId: string) {
  return moveToFolder(messageId, trashFolderId)
}

export async function searchEmails(query: string) {
  const { client } = await getEmailClient()
  const results = await client.searchMessages(query, { limit: 50 })
  return results
}
