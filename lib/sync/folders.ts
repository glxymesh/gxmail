import { db } from "@/lib/db"
import { cachedFolders } from "@/lib/db/schema"
import { ZohoMailClient } from "@/lib/zoho/client"
import { eq, and } from "drizzle-orm"

const SYSTEM_FOLDER_TYPES: Record<string, string> = {
  Inbox: "Inbox",
  Sent: "Sent",
  "Sent Mail": "Sent",
  Drafts: "Drafts",
  Trash: "Trash",
  Spam: "Spam",
  Junk: "Spam",
  Outbox: "Outbox",
  Templates: "Templates",
}

function classifyFolder(folderName: string): string {
  return SYSTEM_FOLDER_TYPES[folderName] || "custom"
}

export async function syncFolders(
  client: ZohoMailClient,
  userId: string
) {
  const folders = await client.getFolders()
  const now = new Date()

  for (const folder of folders) {
    const folderType = classifyFolder(folder.folderName)

    // Upsert folder
    const existing = await db.query.cachedFolders.findFirst({
      where: and(
        eq(cachedFolders.userId, userId),
        eq(cachedFolders.folderId, folder.folderId)
      ),
    })

    if (existing) {
      await db
        .update(cachedFolders)
        .set({
          folderName: folder.folderName,
          messageCount: folder.messageCount,
          unreadCount: folder.unReadCount,
          folderType,
          syncedAt: now,
        })
        .where(eq(cachedFolders.id, existing.id))
    } else {
      await db.insert(cachedFolders).values({
        userId,
        folderId: folder.folderId,
        folderName: folder.folderName,
        messageCount: folder.messageCount,
        unreadCount: folder.unReadCount,
        folderType,
        syncedAt: now,
      })
    }
  }

  return folders
}
