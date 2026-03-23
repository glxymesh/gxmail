"use server"

import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"
import { performInitialSync, performIncrementalSync } from "@/lib/sync"

async function getClientAndUserId() {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    throw new Error("Not authenticated")
  }
  const client = new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )
  return { client, userId: session.user.id }
}

export async function triggerInitialSync() {
  try {
    const { client, userId } = await getClientAndUserId()
    return await performInitialSync(client, userId)
  } catch (error) {
    console.error("[triggerInitialSync] Error:", error)
    return { error: String(error) }
  }
}

export async function triggerIncrementalSync(folderId?: string) {
  try {
    const { client, userId } = await getClientAndUserId()
    return await performIncrementalSync(client, userId, folderId)
  } catch (error) {
    console.error("[triggerIncrementalSync] Error:", error)
    return { error: String(error) }
  }
}
