import { db } from "@/lib/db"
import { cachedFolders } from "@/lib/db/schema"
import type { MailClient } from "@/lib/mail-client"

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
  Starred: "Starred",
  Important: "Important",
}

function classifyFolder(folderName: string, folderType?: string): string {
  // If provider already classified it, use that
  if (folderType && folderType !== "custom") return folderType
  return SYSTEM_FOLDER_TYPES[folderName] || "custom"
}

export async function syncFolders(
  client: MailClient,
  userId: string
) {
  const folders = await client.getFolders()
  const now = new Date()

  for (const folder of folders) {
    const folderType = classifyFolder(folder.folderName, folder.folderType)

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
