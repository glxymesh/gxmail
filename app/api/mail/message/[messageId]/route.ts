import { NextRequest, NextResponse } from "next/server"
import { getEmailClient } from "@/lib/email-client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { client } = await getEmailClient()
    const { messageId } = await params
    const folderId = req.nextUrl.searchParams.get("folderId")
    if (!folderId) {
      return NextResponse.json({ error: "folderId required" }, { status: 400 })
    }
    const content = await client.getMessageContent(folderId, messageId)
    return NextResponse.json({ content })
  } catch (error) {
    console.error("Message content error:", error)
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 })
  }
}
