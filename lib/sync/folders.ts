import { db } from "@/lib/db"
import { cachedFolders } from "@/lib/db/schema"
import { ZohoMailClient } from "@/lib/zoho/client"

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

    // Atomic upsert — no race conditions
    await db
      .insert(cachedFolders)
      .values({
        userId,
        folderId: String(folder.folderId),
        folderName: folder.folderName,
        messageCount: folder.messageCount,
        unreadCount: folder.unReadCount,
        folderType,
        syncedAt: now,
      })
      .onConflictDoUpdate({
        target: [cachedFolders.userId, cachedFolders.folderId],
        set: {
          folderName: folder.folderName,
          messageCount: folder.messageCount,
          unreadCount: folder.unReadCount,
          folderType,
          syncedAt: now,
        },
      })
  }

  return folders
}
