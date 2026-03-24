import { NextRequest, NextResponse } from "next/server"
import { getEmailClient } from "@/lib/email-client"
import { performIncrementalSync } from "@/lib/sync"

export async function GET(req: NextRequest) {
  try {
    const { client, userId } = await getEmailClient()
    const folderId = req.nextUrl.searchParams.get("folderId") || undefined
    const result = await performIncrementalSync(client, userId, folderId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
