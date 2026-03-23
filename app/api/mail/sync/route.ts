import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"
import { performIncrementalSync } from "@/lib/sync"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const folderId = req.nextUrl.searchParams.get("folderId") || undefined

  const client = new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )

  try {
    const result = await performIncrementalSync(client, session.user.id, folderId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    )
  }
}
