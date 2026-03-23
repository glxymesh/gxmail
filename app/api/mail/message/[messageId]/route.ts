import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messageId } = await params
  const folderId = req.nextUrl.searchParams.get("folderId")
  if (!folderId) {
    return NextResponse.json({ error: "folderId required" }, { status: 400 })
  }

  const client = new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )

  try {
    const content = await client.getMessageContent(folderId, messageId)
    return NextResponse.json({ content })
  } catch (error) {
    console.error("Message content error:", error)
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    )
  }
}
