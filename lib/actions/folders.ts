"use server"

import { db } from "@/lib/db"
import { cachedFolders, cachedEmails, emailCacheMetadata } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getEmailClient, getAuthUserId } from "@/lib/email-client"

export async function createFolder(folderName: string, parentFolderId?: string) {
  const { client } = await getEmailClient()
  const userId = await getAuthUserId()

  const folder = await client.createFolder(folderName, parentFolderId)

  await db.insert(cachedFolders).values({
    userId,
    folderId: String(folder.folderId),
    folderName: folder.folderName,
    messageCount: 0,
    unreadCount: 0,
    folderType: "custom",
    syncedAt: new Date(),
  }).onConflictDoUpdate({
    target: [cachedFolders.userId, cachedFolders.folderId],
    set: {
      folderName: folder.folderName,
      syncedAt: new Date(),
    },
  })

  return { success: true, folder }
}

export async function renameFolder(folderId: string, newName: string) {
  const { client } = await getEmailClient()
  const userId = await getAuthUserId()

  await client.renameFolder(folderId, newName)

  await db
    .update(cachedFolders)
    .set({ folderName: newName, syncedAt: new Date() })
    .where(
      and(eq(cachedFolders.userId, userId), eq(cachedFolders.folderId, folderId))
    )

  return { success: true }
}

export async function deleteFolder(folderId: string) {
  const { client } = await getEmailClient()
  const userId = await getAuthUserId()

  await client.deleteFolder(folderId)

  await db
    .delete(cachedFolders)
    .where(
      and(eq(cachedFolders.userId, userId), eq(cachedFolders.folderId, folderId))
    )

  await db
    .delete(cachedEmails)
    .where(
      and(eq(cachedEmails.userId, userId), eq(cachedEmails.folderId, folderId))
    )

  await db
    .delete(emailCacheMetadata)
    .where(
      and(eq(emailCacheMetadata.userId, userId), eq(emailCacheMetadata.folderId, folderId))
    )

  return { success: true }
}
