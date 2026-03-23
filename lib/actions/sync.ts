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
  const { client, userId } = await getClientAndUserId()
  return performInitialSync(client, userId)
}

export async function triggerIncrementalSync(folderId?: string) {
  const { client, userId } = await getClientAndUserId()
  return performIncrementalSync(client, userId, folderId)
}
