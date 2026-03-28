import type { MailClient } from "@/lib/mail-client"
import { syncFolders } from "./folders"
import { syncMessages } from "./messages"
import { db } from "@/lib/db"
import { cachedFolders } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const INITIAL_SYNC_FOLDERS = ["Inbox", "Sent", "Drafts"]

export async function performInitialSync(
  client: MailClient,
  userId: string
) {
  // 1. Sync folders
  const folders = await syncFolders(client, userId)

  // 2. Sync messages for primary folders
  const results: Record<string, { newCount: number; updatedCount: number }> = {}

  for (const folderName of INITIAL_SYNC_FOLDERS) {
    const folder = folders.find(
      (f) => f.folderName === folderName || f.folderType === folderName
    )
    if (folder) {
      results[folderName] = await syncMessages(client, userId, folder.folderId, {
        limit: 200,
      })
    }
  }

  return results
}

export async function performIncrementalSync(
  client: MailClient,
  userId: string,
  folderId?: string
) {
  // Sync folders first for updated counts
  await syncFolders(client, userId)

  if (folderId) {
    // Sync only the specified folder (first page for new messages)
    return syncMessages(client, userId, folderId, { limit: 50 })
  }

  // Sync inbox by default
  const inboxFolder = await db.query.cachedFolders.findFirst({
    where: and(
      eq(cachedFolders.userId, userId),
      eq(cachedFolders.folderType, "Inbox")
    ),
  })

  if (inboxFolder) {
    return syncMessages(client, userId, inboxFolder.folderId, { limit: 50 })
  }

  return { newCount: 0, updatedCount: 0, total: 0 }
}

export { syncFolders, syncMessages }
