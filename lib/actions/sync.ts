"use server"

import { getEmailClient } from "@/lib/email-client"
import { performInitialSync, performIncrementalSync } from "@/lib/sync"

export async function triggerInitialSync() {
  try {
    const { client, userId } = await getEmailClient()
    return await performInitialSync(client, userId)
  } catch (error) {
    console.error("[triggerInitialSync] Error:", error)
    return { error: String(error) }
  }
}

export async function triggerIncrementalSync(folderId?: string) {
  try {
    const { client, userId } = await getEmailClient()
    return await performIncrementalSync(client, userId, folderId)
  } catch (error) {
    console.error("[triggerIncrementalSync] Error:", error)
    return { error: String(error) }
  }
}
